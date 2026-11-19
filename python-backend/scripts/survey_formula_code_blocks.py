"""Lists `code` blocks in stored lessons that are really formulas, not code.

A formula set out in a code box inherits everything a code box means -- a
language chip, line numbers, a copy button -- none of which is true of an
equation. The `formula` block exists now, so this finds the blocks that should
move to it.

    python scripts/survey_formula_code_blocks.py
    python scripts/survey_formula_code_blocks.py --full   # print every block
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text

from app.db.session import SessionLocal

# Tokens that only appear in real code. One of these anywhere and the block is
# left alone -- a wrong conversion is far worse than a missed one.
CODE_TOKENS = re.compile(
    r"(^\s*(def|class|import|from|function|const|let|var|public|private|return|if|for|while|print|echo|SELECT|INSERT|UPDATE|CREATE)\b)"
    r"|[;{}]|=>|\(\)|\breturn\b|#include|</?[a-z]+>",
    re.IGNORECASE | re.MULTILINE,
)

MATH_HINT = re.compile(r"[=×·÷±√∑≈≤≥^]|\b\d+\s*[*/+-]\s*\d+")


def looks_like_formula(code: str) -> bool:
    body = code.strip()
    if not body:
        return False
    lines = [line for line in body.split("\n") if line.strip()]
    if len(lines) > 14:
        return False
    if CODE_TOKENS.search(body):
        return False
    return bool(MATH_HINT.search(body)) and any("=" in line for line in lines)


def walk(structure):
    """Yields (section_index, block_index, block) for every block."""
    if isinstance(structure, list):
        for section_index, section in enumerate(structure):
            if isinstance(section, dict) and isinstance(section.get("content"), list):
                for block_index, block in enumerate(section["content"]):
                    if isinstance(block, dict):
                        yield section_index, block_index, block
            elif isinstance(section, dict):
                yield -1, section_index, section


def main(full: bool) -> int:
    hits = 0
    lessons = 0

    with SessionLocal() as session:
        rows = (
            session.execute(
                text(
                    "SELECT lesson_id, name, lesson_component_structure "
                    "FROM lessons "
                    "WHERE lesson_component_structure::text LIKE '%\"code\"%' "
                    "ORDER BY lesson_id"
                )
            )
            .mappings()
            .all()
        )

        for row in rows:
            found = []
            for section_index, block_index, block in walk(row["lesson_component_structure"] or []):
                if block.get("type") != "code":
                    continue
                data = block.get("data") or {}
                code = data.get("code") or ""
                if looks_like_formula(code):
                    found.append((section_index, block_index, data))

            if not found:
                continue

            lessons += 1
            hits += len(found)
            print(f"\n=== lesson {row['lesson_id']}: {row['name']} -- {len(found)} block(s)")
            for section_index, block_index, data in found:
                print(f"  [{section_index}.{block_index}] lang={data.get('language')!r} title={data.get('title')!r}")
                body = (data.get("code") or "").strip()
                shown = body if full else "\n".join(body.split("\n")[:6])
                for line in shown.split("\n"):
                    print(f"      | {line}")

    print(f"\n{hits} code block(s) in {lessons} lesson(s) look like formulas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main("--full" in sys.argv))
