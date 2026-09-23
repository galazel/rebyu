"""Writes authored lesson content, and indexes it for the AI tutor.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/seed_lessons.py ip_lessons_01 [--commit]

A content module exposes `CERTIFICATION_ID` and `LESSONS`, a dict of
{lesson_id: structure} where the structure is what `builders.lesson_structure`
returns. Only lessons that are currently EMPTY are written unless --overwrite
is passed: a lesson somebody has already authored is not something a batch
script should quietly replace.

The Qdrant step is not optional bookkeeping. The tutor answers from what is
indexed, so a lesson that exists in the database but not in the collection is
a lesson the tutor will either say nothing about or, worse, improvise. Writing
the content and indexing it therefore happen in the same command rather than
being left as a step someone has to remember.

Indexing is scoped by `metadata.kind = "lesson_content"` and the previous
points for a lesson are removed before its new ones are written, so re-running
a module updates the tutor's context instead of duplicating it.
"""

import argparse
import importlib
import json
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
sys.path.insert(0, "/app/scripts/fe_papers")

from sqlalchemy import text

from dbsession import open_session


def plain_text(structure):
    """Flattens a lesson's blocks into the prose the tutor will retrieve.

    Deliberately lossy: the renderer's layout carries no meaning for
    retrieval, but the WORDS inside tabs, accordions and table cells do, and
    an indexer that only read `description` blocks would miss most of a
    well-built lesson -- which is exactly the material a learner asks about.
    """
    out = []

    def walk(value):
        if isinstance(value, dict):
            for key in ("text", "title", "body", "heading", "label",
                        "smallHeader", "description", "caption", "content"):
                item = value.get(key)
                if isinstance(item, str) and item.strip():
                    out.append(item.strip())
            for item in value.values():
                if isinstance(item, (dict, list)):
                    walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    for section in structure:
        name = section.get("sectionName")
        if name:
            out.append("## " + name)
        walk(section.get("content", []))
    return "\n".join(out)


def index_lessons(certification_id, lesson_ids, db):
    """Replaces these lessons' points in the certification's collection."""
    from langchain_core.documents import Document

    from app.rag.chunking import chunk_documents
    from app.rag.store import add_documents, count, get_client, namespace_for

    namespace = namespace_for(certification_id=certification_id)
    client = get_client()

    # Remove this lesson's previous content points, so a re-run updates rather
    # than duplicates. Scrolled and filtered in Python because the collection
    # has no payload index on metadata.kind.
    stale, offset = [], None
    while True:
        points, offset = client.scroll(collection_name=namespace, limit=512,
                                       offset=offset, with_payload=True,
                                       with_vectors=False)
        for point in points:
            meta = (point.payload or {}).get("metadata") or {}
            if meta.get("kind") == "lesson_content" and meta.get("lesson_id") in lesson_ids:
                stale.append(point.id)
        if offset is None:
            break
    for start in range(0, len(stale), 512):
        client.delete(collection_name=namespace,
                      points_selector=stale[start:start + 512], wait=True)
    if stale:
        print("  removed %d stale lesson points" % len(stale))

    rows = db.execute(text("""
        select l.lesson_id, l.name, mc.title, m.title, l.lesson_component_structure
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where l.lesson_id = any(:ids)"""), {"ids": list(lesson_ids)}).fetchall()

    documents = []
    for lesson_id, name, middle, major, structure in rows:
        body = plain_text(structure or [])
        if not body.strip():
            continue
        documents.append(Document(
            page_content="%s (%s / %s)\n\n%s" % (name, major, middle, body),
            metadata={
                "certification_id": certification_id,
                "certification_name": "",
                "source_file": "lesson-%s" % lesson_id,
                "kind": "lesson_content",
                "lesson_id": lesson_id,
                "lesson_name": name,
            }))

    chunks = chunk_documents(documents, certification_id=certification_id)
    added = 0
    for start in range(0, len(chunks), 256):
        added += add_documents(namespace, chunks[start:start + 256])
    print("  indexed %d lessons as %d chunks; %s now holds %d points"
          % (len(documents), added, namespace, count(namespace)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("module")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--skip-index", action="store_true")
    args = parser.parse_args()

    module = importlib.import_module("content_%s" % args.module)
    certification_id = module.CERTIFICATION_ID

    db = open_session()
    written = []
    try:
        for lesson_id, structure in module.LESSONS.items():
            row = db.execute(text("""
                select name, jsonb_array_length(lesson_component_structure)
                  from lessons where lesson_id = :id"""), {"id": lesson_id}).fetchone()
            if row is None:
                raise SystemExit("lesson %s does not exist" % lesson_id)
            name, sections = row
            if sections and not args.overwrite:
                print("  = %-6s %-46s already has %d sections, left alone"
                      % (lesson_id, name[:46], sections))
                continue
            db.execute(text("""
                update lessons set lesson_component_structure = cast(:s as jsonb)
                 where lesson_id = :id"""),
                {"s": json.dumps(structure), "id": lesson_id})
            written.append(lesson_id)
            print("  + %-6s %-46s %d sections" % (lesson_id, name[:46], len(structure)))

        if args.commit:
            db.commit()
            print("\ncommitted: %d lessons written" % len(written))
            if written and not args.skip_index:
                index_lessons(certification_id, set(written), db)
        else:
            db.rollback()
            print("\nDRY RUN (nothing written): %d lessons would be written" % len(written))
    finally:
        db.close()


if __name__ == "__main__":
    main()
