"""
One-time migration script.

Adds {"source": "script.txt"} metadata to all existing ChromaDB documents
that don't already have a "source" field. Run once after deploying the
admin panel to ensure the stats card shows the correct source breakdown.

Usage:
    cd FYP2_P1
    python scripts/migrate_existing.py
"""

import os
import sys
from pathlib import Path

# Allow running from project root
PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

from dotenv import load_dotenv

load_dotenv(dotenv_path=str(PROJECT_DIR / ".env"))

import chromadb

CHROMA_DIR = str(PROJECT_DIR / "chroma_db")
COLLECTION_NAME = "sample"


def main():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(name=COLLECTION_NAME)

    # Get all documents with their metadata
    result = collection.get(include=["metadatas"])
    ids = result["ids"]
    metadatas = result["metadatas"]

    # Find documents without a "source" field
    ids_to_update = []
    new_metadatas = []

    for doc_id, meta in zip(ids, metadatas):
        if "source" not in meta:
            ids_to_update.append(doc_id)
            new_metadatas.append({**meta, "source": "script.txt"})

    if not ids_to_update:
        print("No documents need updating — all already have source metadata.")
        return

    # Update in batches of 500 (ChromaDB limit)
    batch_size = 500
    for i in range(0, len(ids_to_update), batch_size):
        batch_ids = ids_to_update[i : i + batch_size]
        batch_meta = new_metadatas[i : i + batch_size]
        collection.update(ids=batch_ids, metadatas=batch_meta)

    print(f"Updated {len(ids_to_update)} documents with source=script.txt")


if __name__ == "__main__":
    main()
