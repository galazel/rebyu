"""Ingests the past papers into Qdrant, through the service's own RAG stack.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/ingest_qdrant.py [--commit] [--reset]

Uses `app.rag.chunking.chunk_documents` and `app.rag.store.add_documents`
rather than talking to Qdrant directly, so the chunk size, separators,
metadata shape and collection naming are whatever the running service uses --
an ingestion that drifted from those would retrieve badly and be invisible
until it did.

Embeddings are `sentence-transformers/all-MiniLM-L6-v2` running locally on
CPU, which is what `rag_embedding_model` already points at. Nothing here calls
OpenRouter or any paid API.

Two document kinds go in, and both matter:

  * the QUESTIONS, one document per item, carrying the stem, its options, the
    marked answer and the source citation. This is what makes "show me past
    questions about subnetting" work, and what lets the tutor ground an
    explanation in a real exam item rather than inventing one;

  * the PAPER TEXT, page by page, which preserves the surrounding material a
    question refers to -- shared scenarios, preamble, the notational
    conventions table at the front of every paper.

`add_documents` is additive by design: re-running appends rather than
replaces, so --reset is offered for when a collection should be rebuilt.
"""

import argparse
import glob
import json
import os
import sys

sys.path.insert(0, "/app")

import pymupdf
from langchain_core.documents import Document

from app.rag.chunking import chunk_documents
from app.rag.store import add_documents, count, delete_index, namespace_for

PARSED_DIR = "/app/scripts/fe_papers/parsed/"
PDF_DIR = "/app/scripts/fe_papers/pdf/"

#: Which certification each paper belongs to, by filename marker.
CERTIFICATIONS = {"_FE": (14, "FE Exam"), "_IP": (4, "IT Passport Exam")}


def certification_for(name):
    for marker, value in CERTIFICATIONS.items():
        if marker in name:
            return value
    return None


def question_documents(name, records, certification_id, certification_name):
    """One document per question -- stem, options, answer, citation."""
    documents = []
    for record in records:
        if not record.get("answer") or len(record.get("choices", {})) != 4:
            continue
        options = "\n".join(
            "%s) %s%s" % (letter, record["choices"][letter],
                          "  [correct]" if letter == record["answer"] else "")
            for letter in "abcd" if letter in record["choices"])
        body = "%s\n\n%s\n\nCorrect answer: %s" % (
            record["stem"], options, record["answer"])
        if record.get("image_key"):
            body += "\n[This question includes a figure.]"
        documents.append(Document(
            page_content=body,
            metadata={
                "certification_id": certification_id,
                "certification_name": certification_name,
                "source_file": name,
                "kind": "past_question",
                "paper": name,
                "question_number": record["number"],
                "lesson_id": record.get("lesson_id"),
                "lesson_name": record.get("lesson_name"),
                "answer": record["answer"],
                "page": (record.get("span") or [{}])[0].get("page"),
            }))
    return documents


def paper_documents(name, certification_id, certification_name):
    """One document per page of the original paper."""
    path = PDF_DIR + name + "_Questions.pdf"
    if not os.path.exists(path):
        return []
    doc = pymupdf.open(path)
    documents = []
    for index in range(doc.page_count):
        body = doc[index].get_text().strip()
        if len(body) < 80:
            continue
        documents.append(Document(
            page_content=body,
            metadata={
                "certification_id": certification_id,
                "certification_name": certification_name,
                "source_file": name + "_Questions.pdf",
                "kind": "past_paper_page",
                "paper": name,
                "page": index + 1,
            }))
    doc.close()
    return documents


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("papers", nargs="*")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    names = args.papers or [os.path.basename(p)[:-5]
                            for p in sorted(glob.glob(PARSED_DIR + "*.json"))]

    if args.reset and args.commit:
        for certification_id, _ in set(CERTIFICATIONS.values()):
            namespace = namespace_for(certification_id=certification_id)
            if delete_index(namespace):
                print("reset collection %s" % namespace)

    by_certification = {}
    for name in names:
        info = certification_for(name)
        if info is None:
            print("  %-18s SKIPPED -- no certification mapping" % name)
            continue
        certification_id, certification_name = info
        records = json.load(open(PARSED_DIR + name + ".json", encoding="utf-8"))

        documents = question_documents(name, records, certification_id, certification_name)
        documents += paper_documents(name, certification_id, certification_name)
        by_certification.setdefault(
            (certification_id, certification_name), []).extend(documents)
        print("  %-18s %4d question docs + pages" % (name, len(documents)))

    for (certification_id, certification_name), documents in by_certification.items():
        chunks = chunk_documents(documents,
                                 certification_id=certification_id,
                                 certification_name=certification_name)
        namespace = namespace_for(certification_id=certification_id)
        print("\n%s -> %s: %d documents, %d chunks"
              % (certification_name, namespace, len(documents), len(chunks)))
        if args.commit:
            # Batched: embedding several thousand chunks in one call holds
            # every vector in memory at once, and this container has been
            # killed by exactly that before.
            added = 0
            for start in range(0, len(chunks), 256):
                added += add_documents(namespace, chunks[start:start + 256])
                print("    %d/%d" % (added, len(chunks)), flush=True)
            print("    collection now holds %d points" % count(namespace))
        else:
            print("    DRY RUN -- nothing written")


if __name__ == "__main__":
    main()
