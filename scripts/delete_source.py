"""
Delete all chunks for a given source from the ChromaDB collection.

Usage:
    1. Stop the backend (Chroma's SQLite writer lock is exclusive).
    2. From the project root:
          python scripts/delete_source.py                      # lists sources
          python scripts/delete_source.py "Fee and Payment.txt" # deletes by label
    3. Restart the backend.
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


def list_sources(collection) -> dict[str, int]:
    result = collection.get(include=["metadatas"])
    counts: dict[str, int] = {}
    for meta in result["metadatas"]:
        src = (meta or {}).get("source", "<no source>")
        counts[src] = counts.get(src, 0) + 1
    return counts


def print_sources(counts: dict[str, int]) -> None:
    print("Sources currently in the collection:")
    if not counts:
        print("  (empty)")
        return
    width = max(len(s) for s in counts)
    for src, n in sorted(counts.items()):
        print(f"  {n:5d}  {src:<{width}}")


def delete_source(collection, source: str) -> int:
    matches = collection.get(where={"source": source})
    ids = matches["ids"]
    if not ids:
        return 0
    collection.delete(ids=ids)
    return len(ids)


def main() -> None:
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_collection(name=COLLECTION_NAME)

    counts = list_sources(collection)
    print_sources(counts)
    print()

    if len(sys.argv) < 2:
        print("To delete chunks for a specific source, re-run with the label:")
        print('  python scripts/delete_source.py "<source label from the list above>"')
        return

    # Join all remaining args so unquoted filenames with spaces still work:
    #   python scripts/delete_source.py Fee and Payment.txt
    target = " ".join(sys.argv[1:])
    if target not in counts:
        print(f"No chunks found for source {target!r}.")
        print("Tip: the source label is the filename as it was uploaded (case-sensitive).")
        sys.exit(1)

    expected = counts[target]
    print(f"About to delete {expected} chunks for source: {target!r}")
    deleted = delete_source(collection, target)
    print(f"Deleted {deleted} chunks.")


if __name__ == "__main__":
    main()
