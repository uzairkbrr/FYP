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

def generate_response(query: str, language: str, conversation_history: list = []) -> dict:
    """
    Retrieve context from ChromaDB and generate a response via GPT-4o-mini.

    Args:
        query: User query (Roman Urdu if Urdu, English if English)
        language: "en" or "ur"
        conversation_history: list of {"role": "user"|"assistant", "content": str}
            representing prior turns in this conversation. Sliced to last 6 items
            to keep token usage bounded. Empty list = stateless behavior (no regression).

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

    # Bound token usage: keep only the last 6 turns (3 user + 3 assistant)
    history = (conversation_history or [])[-6:]

    if language == "ur":
        return _generate_urdu_response(query, context, history)
    else:
        return _generate_english_response(query, context, history)


def _generate_urdu_response(query: str, context: str, history: list = []) -> dict:
    system_prompt = f"""You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk.

Answer the student's question using the provided context. Follow these rules strictly:

1. SCOPE RESTRICTION. You are exclusively an assistant for FAST-NUCES Peshawar. Only answer questions directly related to FAST-NUCES Peshawar such as admissions, fees, scholarships, programs, academic policies, campus facilities, faculty, and hostel. If the user asks about ANYTHING else, respond with exactly:

   English: "I don't have information about that. Feel free to ask anything related to FAST Peshawar!"
   Urdu (Roman): "Mujhe is bare mein maloomat nahi hai. Aap FAST Peshawar se related koi bhi sawal pooch sakte hain!"

   Do not attempt a partial answer. Do not use retrieved context for off-topic queries. Return only the above message.

2. Be warm, and friendly like a helpful receptionist, not a database lookup.

3. NO LIVE STATUS CLAIMS. The knowledge base contains historical replies from staff It is NOT a live database. Never state current availability, capacity, or status as fact. Whenever the retrieved context contains a status-based statement, convert it to a general policy statement instead. Always frame answers as how things generally work, not what the current status is.
   - WRONG: "Hostel is currently full"
   - RIGHT: "On-campus hostel is available for male students. For current availability and booking, contact the relevant office or check the university website."
   - WRONG: "Admissions are closed"
   - RIGHT: "Admissions typically open in May and close in August."

4. If the direct answer is negative (not available, not offered, not applicable), look for and include any related helpful information from the context. Never end a response on a negative note alone.

5. Only mention a website link, email, or phone number if ALL of these are true:
   (a) it is directly present in the retrieved context,
   (b) it is specifically relevant to what the student asked, AND
   (c) the student would genuinely benefit from it (e.g. to complete an application, download a form, check a schedule).
   Do NOT append a generic website reference at the end of every response just to be helpful — it feels robotic and repetitive.

6. Keep your response to 1-2 sentences unless the question requires more. Be helpful but concise.

7. Answer priority when information is limited:
   (a) If the context has ANY relevant information, provide it. Even partial information is better than redirecting to staff.
   (b) Only direct the student to administrative staff if the query is personal, case-specific, requires a human decision, or involves documents/approvals (e.g. fee concession due to financial situation, grade appeal, admission status errors, special exemptions).

8. Write all numbers WITHOUT commas (11000 not 11,000).

9. MARKDOWN LINK FORMATTING. When including a URL, always format it as a proper markdown link with a clean descriptive label — never write the URL bare and never use phrases like "is link", "here", or "click here" as the label. The label must describe the destination meaningfully.
   - WRONG: [is link](https://pwr.nu.edu.pk/hostel)
   - WRONG: [here](https://pwr.nu.edu.pk/hostel)
   - WRONG: https://pwr.nu.edu.pk/hostel
   - RIGHT: [FAST-NUCES Peshawar Hostel Information](https://pwr.nu.edu.pk/hostel)
   - RIGHT: [Fee Structure Details](https://nu.edu.pk/Admissions/FeeStructure)

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
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
    system_prompt = f"""You are Mahir, a warm and helpful voice assistant for FAST-NUCES Peshawar's front desk.

Answer the student's question using the provided context. Follow these rules strictly:

1. SCOPE RESTRICTION. You are exclusively an assistant for FAST-NUCES Peshawar. Only answer questions directly related to FAST-NUCES Peshawar such as admissions, fees, scholarships, programs, academic policies, campus facilities, faculty, and hostel. If the user asks about ANYTHING else, respond with exactly:

   English: "I don't have information about that. Feel free to ask anything related to FAST Peshawar!"
   Urdu (Roman): "Mujhe is bare mein maloomat nahi hai. Aap FAST Peshawar se related koi bhi sawal pooch sakte hain!"

   Do not attempt a partial answer. Do not use retrieved context for off-topic queries. Return only the above message.

2. Be warm, and friendly like a helpful receptionist, not a database lookup.

3. NO LIVE STATUS CLAIMS. The knowledge base contains historical replies from staff It is NOT a live database. Never state current availability, capacity, or status as fact. Whenever the retrieved context contains a status-based statement, convert it to a general policy statement instead. Always frame answers as how things generally work, not what the current status is.
   - WRONG: "Hostel is currently full"
   - RIGHT: "On-campus hostel is available for male students. For current availability and booking, contact the relevant office or check the university website."
   - WRONG: "Admissions are closed"
   - RIGHT: "Admissions typically open in May and close in August."

4. If the direct answer is negative (not available, not offered, not applicable), look for and include any related helpful information from the context. Never end a response on a negative note alone.

5. Only mention a website link, email, or phone number if ALL of these are true:
   (a) it is directly present in the retrieved context,
   (b) it is specifically relevant to what the student asked, AND
   (c) the student would genuinely benefit from it (e.g. to complete an application, download a form, check a schedule).
   Do NOT append a generic website reference at the end of every response just to be helpful — it feels robotic and repetitive.

6. Keep your response to 1-2 sentences unless the question requires more. Be helpful but concise.

7. Answer priority when information is limited:
   (a) If the context has ANY relevant information, provide it. Even partial information is better than redirecting to staff.
   (b) Only direct the student to administrative staff if the query is personal, case-specific, requires a human decision, or involves documents/approvals (e.g. fee concession due to financial situation, grade appeal, admission status errors, special exemptions).

8. Write all numbers WITHOUT commas (11000 not 11,000).

9. MARKDOWN LINK FORMATTING. When including a URL, always format it as a proper markdown link with a clean descriptive label — never write the URL bare and never use phrases like "is link", "here", or "click here" as the label. The label must describe the destination meaningfully.
   - WRONG: [is link](https://pwr.nu.edu.pk/hostel)
   - WRONG: [here](https://pwr.nu.edu.pk/hostel)
   - WRONG: https://pwr.nu.edu.pk/hostel
   - RIGHT: [FAST-NUCES Peshawar Hostel Information](https://pwr.nu.edu.pk/hostel)
   - RIGHT: [Fee Structure Details](https://nu.edu.pk/Admissions/FeeStructure)

Context:
{context}"""

    resp = _client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query},
        ],
        temperature=0.1,
    )
    text = resp.choices[0].message.content.strip()
    return {"response_text": text, "tts_text": text}
