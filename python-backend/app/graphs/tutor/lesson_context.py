"""Flattens a lesson's stored content blocks into plain text for the tutor.

`lessons.lesson_component_structure` is a jsonb array of display blocks (see
`frontend/src/components/certifications/lesson-content-renderer.jsx` for the
full block vocabulary: heading, description, image-left-text, tabs,
accordion, ...). The tutor doesn't need to understand that shape -- it just
needs the words -- so this walks the tree and collects every string that
looks like lesson prose, skipping the fields that are asset references
rather than content (image/video keys, source URLs, raw type/id tags).
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from sqlalchemy import text as sql_text

from app.rag.retriever import retrieve_context
from app.rag.store import namespace_for
from app.repositories.java_backend import get_lesson

#: Keys that hold identifiers or asset pointers, not words a tutor should read.
_SKIP_KEYS = {
    "type",
    "id",
    "imagekey",
    "videokey",
    "sourceurl",
    "sourcename",
    "key",
    "href",
    "url",
    "icon",
}

#: Plain text this large already carries more lesson content than a tutor
#: reply needs, and keeps a chatty lesson from ballooning every turn's prompt.
_MAX_CHARS = 8000


def _collect_strings(value: Any, out: list[str]) -> None:
    if isinstance(value, str):
        text = value.strip()
        if text:
            out.append(text)
        return

    if isinstance(value, dict):
        for key, item in value.items():
            if key.lower() in _SKIP_KEYS:
                continue
            _collect_strings(item, out)
        return

    if isinstance(value, list):
        for item in value:
            _collect_strings(item, out)


def flatten_lesson_blocks(blocks: Any) -> str:
    strings: list[str] = []
    _collect_strings(blocks, strings)
    text = "\n".join(strings)
    if len(text) > _MAX_CHARS:
        text = text[:_MAX_CHARS] + "\n...(truncated)"
    return text


#: How much retrieved source material a tutor turn carries, on top of the
#: lesson body. Deliberately smaller than the lesson's own budget: this is
#: supporting evidence for a chat reply, not a second lesson.
_SOURCE_CHARS = 4000


def _certification_of(session: Session, lesson_id: int):
    """(id, title) of the certification a lesson belongs to, or None.

    Walked in SQL rather than through the repository helpers because the path
    is lesson -> middle category -> major category -> certification, and
    three round trips for one chat turn is three round trips the learner
    waits through.
    """
    row = session.execute(sql_text("""
        select c.certification_id, c.title
          from lessons l
          join middle_categories m on m.middle_category_id = l.middle_category_id
          join major_categories j on j.major_category_id = m.major_category_id
          join certifications c on c.certification_id = j.certification_id
         where l.lesson_id = :lesson_id"""), {"lesson_id": lesson_id}).first()
    return (row[0], row[1] or "") if row else None


def load_source_material(session: Session, lesson_id: int, question: str):
    """What the certification's uploaded documents say about this question.

    The tutor was grounded in the lesson's rendered blocks and nothing else.
    That bounds what it may TALK about, but it does not stop it inventing
    detail: asked something the lesson mentions without explaining -- a
    protocol's port number, what an acronym expands to, which of two methods
    is faster -- the model had no source for the answer and answered anyway,
    from memory, in the lesson's confident voice.

    The certification's own uploaded syllabus is already indexed by
    `document_ingestion_node`. Retrieving the passages that match the
    learner's actual question gives the tutor something real to answer from,
    and gives it the standing to say the material does not cover it.

    Returns None when the certification has no indexed documents -- the
    ordinary case for one built without uploads -- and the tutor then behaves
    exactly as it did before.
    """
    if not question:
        return None
    try:
        found = _certification_of(session, lesson_id)
        if not found:
            return None
        certification_id, title = found
        return retrieve_context(
            namespace_for(certification_id=certification_id, certification_name=title),
            question,
            max_chars=_SOURCE_CHARS,
        ) or None
    except Exception:
        # A missing or unreadable index must never take the chat down; the
        # lesson body alone is still a usable grounding.
        return None


def load_lesson_context(session: Session, lesson_id: int) -> str | None:
    """The lesson's title and flattened body text, or `None` if it has no
    content yet (a lesson still being generated, or an unrecognised id)."""
    lesson = get_lesson(session, lesson_id)
    if not lesson:
        return None

    body = flatten_lesson_blocks(lesson.get("lesson_component_structure"))
    if not body:
        return None

    return f"Lesson: {lesson['name']}\n\n{body}"
