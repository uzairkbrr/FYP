"""
Wipe and rebuild the ChromaDB collection.

Deletes the entire "sample" collection and re-creates it empty.
The admin can then re-upload each category file through the admin panel.

Usage:
    cd FYP2_P1
    python scripts/reset_chromadb.py
"""

import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

from dotenv import load_dotenv
load_dotenv(dotenv_path=str(PROJECT_DIR / ".env"))

import chromadb

CHROMA_DIR = str(PROJECT_DIR / "chroma_db")
COLLECTION_NAME = "sample"


def main():
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Delete existing collection
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"Deleted collection '{COLLECTION_NAME}'.")
    except Exception:
        print(f"Collection '{COLLECTION_NAME}' did not exist, nothing to delete.")

    # Re-create empty
    client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"ChromaDB reset complete. Collection '{COLLECTION_NAME}' is now empty.")


if __name__ == "__main__":
    main()
