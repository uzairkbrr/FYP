import hashlib
import json
import openai
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .config import OPENAI_API_KEY, CHROMA_PERSIST_DIR, CHROMA_COLLECTION, RAG_TOP_K, GPT_MODEL

_client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Initialize ChromaDB once at module load
_embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
_vectorstore = Chroma(
    embedding_function=_embeddings,
    persist_directory=CHROMA_PERSIST_DIR,
    collection_name=CHROMA_COLLECTION,
)


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------

def _generate_description(text: str) -> str:
    """Call GPT-4o-mini once to generate a short description of the text."""
    try:
        resp = _client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Read the following text and write a "
                        "single short sentence (max 12 words) describing what topics it covers. "
                        "Be specific. Do not start with 'This file' or 'This document'. "
                        "Just state the topics directly."
                    ),
                },
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
    # Generate a one-liner description of the file (once, not per chunk)
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


# ---------------------------------------------------------------------------
# RAG query (unchanged)
# ---------------------------------------------------------------------------

def generate_response(query: str, language: str) -> dict:
    """
    Retrieve context from ChromaDB and generate a response via GPT-4o-mini.

    Args:
        query: User query (Roman Urdu if Urdu, English if English)
        language: "en" or "ur"

    Returns:
        {"response_text": str, "tts_text": str}
        - response_text: display text (Roman Urdu or English)
        - tts_text: text for TTS (Arabic Urdu or English)
    """
    retrieved = _vectorstore.similarity_search(query, k=RAG_TOP_K)

    pieces = []
    for i, doc in enumerate(retrieved):
        cat = doc.metadata.get("category", "N/A")
        pieces.append(f"[{i + 1}] Category: {cat}\n{doc.page_content}")
    context = "\n\n".join(pieces)

    if language == "ur":
        return _generate_urdu_response(query, context)
    else:
        return _generate_english_response(query, context)


def _generate_urdu_response(query: str, context: str) -> dict:
    system_prompt = f"""You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk. You help students with queries about admissions, fees, scholarships, programs, and campus life.

Answer the student's question using the provided context. Follow these rules strictly:

1. Be warm, friendly, and conversational in Roman Urdu — like a helpful university staff member speaking to a student, not a database lookup. Never give a cold one-line answer if more context is available.

2. If the direct answer is negative (not available, not offered, not applicable), always look for and include any related helpful information from the context — a website, contact number, alternative option, or next step. Never end a response on a negative note alone.

3. If the context contains a website link, email address, or phone number relevant to the query, mention it at the end of your response.

4. Keep your response to 2-4 sentences unless the question requires more. Be helpful but concise.

5. Answer ONLY from the provided context. If the information is not in the context, say: "Mujhe is bare mein kafi maloomat nahi hai. Behtar hoga ke aap admissions office se raabta karein ya FAST-NUCES ki website dekhein."

6. Write all numbers WITHOUT commas (11000 not 11,000). Currency format: Rs. 11000 per credit hour.

Respond with a JSON object with keys "roman_urdu" and "arabic_urdu" containing the answer in Roman Urdu and Urdu (Arabic script) respectively.

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
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


def _generate_english_response(query: str, context: str) -> dict:
    system_prompt = f"""You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk. You help students with queries about admissions, fees, scholarships, programs, and campus life.

Answer the student's question using the provided context. Follow these rules strictly:

1. Be warm, friendly, and conversational — like a helpful receptionist, not a database lookup. Never give a cold one-line answer if more context is available.

2. If the direct answer is negative (not available, not offered, not applicable), always look for and include any related helpful information from the context — a website, contact number, alternative option, or next step. Never end a response on a negative note alone.

3. If the context contains a website link, email address, or phone number relevant to the query, mention it at the end of your response.

4. Keep your response to 2-4 sentences unless the question requires more. Be helpful but concise.

5. Answer ONLY from the provided context. If the information is not in the context, say: "I don't have that specific information right now. I'd recommend reaching out to the admissions office directly or visiting the FAST-NUCES website for the most accurate details."

6. Write all numbers WITHOUT commas (11000 not 11,000). Currency format: Rs. 11000 per credit hour.

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content.strip()
    return {"response_text": text, "tts_text": text}
