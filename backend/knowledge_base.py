import hashlib
import json
import openai
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .settings import (
    _k1,
    model_text,
    _s1, _s2, _s3,
    CHROMA_PERSIST_DIR, CHROMA_COLLECTION, RAG_TOP_K,
)

_client = openai.OpenAI(api_key=_k1)

# Initialize ChromaDB once at module load
_embeddings = OpenAIEmbeddings(api_key=_k1)
_vectorstore = Chroma(
    embedding_function=_embeddings,
    persist_directory=CHROMA_PERSIST_DIR,
    collection_name=CHROMA_COLLECTION,
)

# Ingestion
def _generate_description(text: str) -> str:
    """Generate a short description of the text (uses system prompt _s1)."""
    try:
        resp = _client.chat.completions.create(
            model=model_text,
            messages=[
                {"role": "system", "content": _s1},
                {"role": "user", "content": text[:3000]},
            ],
            temperature=0.0,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return ""


def ingest_text(text: str, source_label: str) -> dict:
    """
    Chunk, embed, and upsert new text into the existing ChromaDB collection.

    Uses deterministic IDs so re-uploading the same content is idempotent.
    Existing documents are never deleted — this is purely additive.

    Returns: {"chunks_added": int, "source": source_label, "description": str}
    """
    description = _generate_description(text)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )
    chunks = splitter.split_text(text)

    ids = []
    metadatas = []
    for idx, chunk in enumerate(chunks):
        raw = f"{source_label}::{idx}::{chunk[:40]}"
        doc_id = hashlib.md5(raw.encode("utf-8")).hexdigest()
        ids.append(doc_id)
        metadatas.append({"source": source_label, "description": description})

    _vectorstore.add_texts(texts=chunks, ids=ids, metadatas=metadatas)

    return {"chunks_added": len(chunks), "source": source_label, "description": description}


def get_collection_stats() -> dict:
    """Return total chunk count and per-source breakdown with descriptions."""
    col = _vectorstore._collection
    result = col.get(include=["metadatas"])

    total = len(result["ids"])
    source_info: dict[str, dict] = {}
    for meta in result["metadatas"]:
        src = meta.get("source", "unknown")
        if src not in source_info:
            source_info[src] = {"chunks": 0, "description": meta.get("description", "")}
        source_info[src]["chunks"] += 1

    sources = [
        {"source": s, "chunks": info["chunks"], "description": info["description"]}
        for s, info in sorted(source_info.items())
    ]
    return {"total_chunks": total, "sources": sources}

# RAG query
def generate_response(query: str, language: str, conversation_history: list = []) -> dict:
    """
    Retrieve context from ChromaDB and generate a response via the text model.

    Args:
        query: User query (Roman Urdu if Urdu, English if English)
        language: "en" or "ur"
        conversation_history: list of {"role": "user"|"assistant", "content": str}

    Returns:
        {"response_text": str, "tts_text": str}
    """
    retrieved = _vectorstore.similarity_search(query, k=RAG_TOP_K)

    pieces = []
    for i, doc in enumerate(retrieved):
        cat = doc.metadata.get("category", "N/A")
        pieces.append(f"[{i + 1}] Category: {cat}\n{doc.page_content}")
    context = "\n\n".join(pieces)

    # Bound token usage: keep only the last 6 turns (3 user + 3 assistant)
    history = (conversation_history or [])[-6:]

    if language == "ur":
        return _generate_urdu_response(query, context, history)
    else:
        return _generate_english_response(query, context, history)


def _generate_urdu_response(query: str, context: str, history: list = []) -> dict:
    system_prompt = _s2.format(context=context)

    resp = _client.chat.completions.create(
        model=model_text,
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        parsed = json.loads(text[start:end])
        return {
            "response_text": parsed.get("roman_urdu", text),
            "tts_text": parsed.get("arabic_urdu", text),
        }
    except Exception:
        return {"response_text": text, "tts_text": text}


def _generate_english_response(query: str, context: str, history: list = []) -> dict:
    system_prompt = _s3.format(context=context)

    resp = _client.chat.completions.create(
        model=model_text,
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content.strip()
    return {"response_text": text, "tts_text": text}
