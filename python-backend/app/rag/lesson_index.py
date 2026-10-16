"""Indexes a lesson's own content into its certification's vector collection.

Only uploaded source documents used to be embedded, so a lesson written by
hand in the editor was invisible to retrieval: the tutor's source lookup, the
question bank and regeneration all searched a collection that never held it.

Each save replaces the lesson's chunks wholesale (keyed by `source_file`
"lesson:<id>"), so edits and deleted sections never leave stale vectors.

Backfill every existing lesson with:  python -m app.rag.lesson_index --all
"""

from __future__ import annotations

import argparse
import json
import logging
from typing import Any

from langchain_core.documents import Document
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

from app.graphs.tutor.lesson_context import _certification_of, _collect_strings
from app.rag.chunking import chunk_documents
from app.rag.store import namespace_for, replace_source
from app.repositories.java_backend import get_lesson

logger = logging.getLogger(__name__)


def lesson_source(lesson_id: int) -> str:
    return f"lesson:{lesson_id}"


def _sections(structure: Any) -> list[dict]:
    if isinstance(structure, str):
        try:
            structure = json.loads(structure or "[]")
        except ValueError:
            return []
    return [item for item in structure or [] if isinstance(item, dict)]


def lesson_documents(lesson_id: int, lesson_name: str, structure: Any) -> list[Document]:
    """One document per section, prefixed with the lesson and section names so
    every chunk still says where it came from once it is split."""
    documents = []
    for section in _sections(structure):
        strings: list[str] = []
        _collect_strings(section.get("content") or [], strings)
        body = "\n".join(strings).strip()
        if not body:
            continue
        section_name = str(section.get("sectionName") or "").strip()
        documents.append(Document(
            page_content=f"Lesson: {lesson_name}\nSection: {section_name}\n\n{body}",
            metadata={
                "source_file": lesson_source(lesson_id),
                "origin": "lesson",
                "lesson_id": lesson_id,
                "lesson_name": lesson_name,
                "section": section_name,
            },
        ))
    return documents


def index_lesson(session: Session, lesson_id: int) -> int:
    """Re-embeds one lesson. Returns the number of chunks now indexed (0 when
    the lesson is empty, which also clears any chunks it used to have)."""
    lesson = get_lesson(session, lesson_id)
    if not lesson:
        return 0
    found = _certification_of(session, lesson_id)
    if not found:
        return 0
    certification_id, title = found

    documents = lesson_documents(
        lesson_id, lesson.get("name") or "", lesson.get("lesson_component_structure")
    )
    chunks = chunk_documents(
        documents, certification_id=certification_id, certification_name=title
    )
    count = replace_source(
        namespace_for(certification_id=certification_id, certification_name=title),
        lesson_source(lesson_id),
        chunks,
    )
    logger.info("Indexed lesson %s into cert_%s: %d chunks", lesson_id, certification_id, count)
    return count


def _main() -> None:
    from app.db.session import SessionLocal

    parser = argparse.ArgumentParser(description="Embed lesson content into Qdrant.")
    parser.add_argument("--all", action="store_true", help="index every lesson")
    parser.add_argument("lesson_ids", nargs="*", type=int)
    args = parser.parse_args()

    with SessionLocal() as session:
        ids = args.lesson_ids
        if args.all:
            ids = [row[0] for row in session.execute(sql_text(
                "select lesson_id from lessons order by lesson_id"))]
        total = 0
        for lesson_id in ids:
            try:
                total += index_lesson(session, lesson_id)
            except Exception as error:  # keep going; one bad lesson shouldn't stop a backfill
                print(f"lesson {lesson_id}: {error}")
        print(f"Indexed {len(ids)} lessons, {total} chunks")


if __name__ == "__main__":
    _main()
