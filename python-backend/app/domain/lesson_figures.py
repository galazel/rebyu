"""A drawn figure for a lesson block when no real image can be found.

The generated lesson says what a picture should show (`imageQuery`). When
Wikimedia has nothing relevant, the block used to be left without a picture.
It now gets a figure drawn from what the lesson itself says, in the style of
the hand-made TOPCIT and FE figures:

  * a block that carries items -- grid items, tabs, accordion entries, cards --
    is drawn as a grid of labelled boxes, one box per item, each with an accent
    bar, its name and its explanation;
  * otherwise the description (the block's own, or the list or paragraph just
    before it) is drawn as numbered steps.

The drawing follows the rule the hand-made figures were first shipped without:
SVG text never wraps on its own, so every line is broken to fit its box before
it is drawn, and every box grows to hold the lines it was given.
"""

from __future__ import annotations

import logging
import re
import uuid

logger = logging.getLogger(__name__)

WIDTH = 900
MARGIN = 28
GAP = 16
FONT = "system-ui, -apple-system, 'Segoe UI', Nunito, 'Helvetica Neue', Arial, sans-serif"
INK = "#4b4b4b"
MUTED = "#777777"
LINE = "#e5e5e5"
PAPER = "#ffffff"
WASH = "#f7faf5"
ACCENTS = ("#58a700", "#1f7a8c", "#ff9600", "#2b8a3e", "#ce4a4a", "#7a6a2e")

#: Average glyph advance as a fraction of font size. Slightly generous, so a
#: line of wide letters still fits inside its box.
GLYPH_WIDTH = 0.56
MAX_POINTS = 5
MAX_ITEMS = 6
STORAGE_PREFIX = "lesson-figures"


def _escape(text: str) -> str:
    return (str(text).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def wrap_lines(text: str, width: float, size: float) -> list[str]:
    """Greedy word wrap to an estimated pixel width. A single over-long word is split."""
    per_line = max(8, int(width / (size * GLYPH_WIDTH)))
    lines, current = [], ""
    for word in str(text).split():
        while len(word) > per_line:
            if current:
                lines.append(current)
                current = ""
            lines.append(word[:per_line])
            word = word[per_line:]
        candidate = f"{current} {word}".strip()
        if len(candidate) > per_line and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def _text_lines(lines: list[str], x: float, y: float, size: float, weight: int, fill: str,
                line_height: float, anchor: str = "start") -> str:
    return "".join(
        f'<text x="{x}" y="{y + index * line_height}" font-size="{size}" font-weight="{weight}" '
        f'fill="{fill}" text-anchor="{anchor}">{_escape(line)}</text>'
        for index, line in enumerate(lines)
    )


def _shorten(text: str, limit: int) -> str:
    text = " ".join(str(text).split())
    return text if len(text) <= limit else text[:limit - 3].rstrip() + "..."


def points_from(text: str | None) -> list[str]:
    """A description as up to five short points, one sentence each."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", str(text or "")) if s.strip()]
    return [_shorten(s, 220) for s in sentences[:MAX_POINTS]]


def _heading(title: str) -> tuple[str, float]:
    lines = wrap_lines(title, WIDTH - 2 * MARGIN, 22)
    return _text_lines(lines, MARGIN, 50, 22, 800, INK, 28), 50 + (len(lines) - 1) * 28 + 26


def _svg(title: str, height: float, body: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {height}" '
            f'width="{WIDTH}" height="{height}" font-family="{_escape(FONT)}" role="img" '
            f'aria-label="{_escape(title)}"><rect width="{WIDTH}" height="{height}" fill="{PAPER}"/>'
            + body + "</svg>")


def _draw_steps(title: str, points: list[str]) -> str:
    heading, y = _heading(title)
    parts = [heading]
    text_x, text_width = MARGIN + 64, WIDTH - 2 * MARGIN - 64 - 20
    for index, point in enumerate(points or [title]):
        lines = wrap_lines(point, text_width, 15)
        height = max(58, 26 + len(lines) * 21)
        accent = ACCENTS[index % len(ACCENTS)]
        parts.append(f'<rect x="{MARGIN}" y="{y}" width="{WIDTH - 2 * MARGIN}" height="{height}" rx="14" '
                     f'fill="{WASH}" stroke="{LINE}" stroke-width="2"/>')
        parts.append(f'<rect x="{MARGIN}" y="{y + 10}" width="6" height="{height - 20}" rx="3" fill="{accent}"/>')
        parts.append(f'<circle cx="{MARGIN + 36}" cy="{y + height / 2}" r="15" fill="{accent}"/>')
        parts.append(f'<text x="{MARGIN + 36}" y="{y + height / 2 + 5}" font-size="14" font-weight="800" '
                     f'fill="{PAPER}" text-anchor="middle">{index + 1}</text>')
        parts.append(_text_lines(lines, text_x, y + (height - len(lines) * 21) / 2 + 15, 15, 500, INK, 21))
        y += height + 12
    return _svg(title, y + 16, "".join(parts))


def _draw_grid(title: str, items: list[dict]) -> str:
    """One labelled box per item, up to three a row -- the kit's `label_box` look."""
    heading, y = _heading(title)
    parts = [heading]
    columns = 3 if len(items) >= 5 or len(items) == 3 else 2
    box_width = (WIDTH - 2 * MARGIN - GAP * (columns - 1)) / columns
    inner = box_width - 36
    for row_start in range(0, len(items), columns):
        row = items[row_start:row_start + columns]
        laid_out = []
        for item in row:
            name = wrap_lines(_shorten(item["title"], 80), inner, 15)
            detail = wrap_lines(_shorten(item.get("description", ""), 240), inner, 13) if item.get("description") else []
            laid_out.append((name, detail, 22 + len(name) * 20 + (8 + len(detail) * 18 if detail else 0) + 14))
        height = max(64, max(block_height for _n, _d, block_height in laid_out))
        for offset, (name, detail, _h) in enumerate(laid_out):
            index = row_start + offset
            x = MARGIN + offset * (box_width + GAP)
            accent = ACCENTS[index % len(ACCENTS)]
            parts.append(f'<rect x="{x}" y="{y}" width="{box_width}" height="{height}" rx="14" '
                         f'fill="{WASH}" stroke="{LINE}" stroke-width="2"/>')
            parts.append(f'<rect x="{x}" y="{y + 10}" width="6" height="{height - 20}" rx="3" fill="{accent}"/>')
            parts.append(_text_lines(name, x + 22, y + 30, 15, 800, INK, 20))
            if detail:
                parts.append(_text_lines(detail, x + 22, y + 30 + len(name) * 20 + 8, 13, 400, MUTED, 18))
        y += height + GAP
    return _svg(title, y + 12, "".join(parts))


def draw_figure(title: str, points: list[str] | None = None, items: list[dict] | None = None) -> str:
    """A grid of labelled boxes when there are items, numbered steps otherwise."""
    usable = [item for item in (items or []) if str(item.get("title", "")).strip()][:MAX_ITEMS]
    if len(usable) >= 2:
        return _draw_grid(title, usable)
    return _draw_steps(title, points or [])


def figure_content(query: str, context: dict | None) -> tuple[str, list[str], list[dict]]:
    """Heading, points and items for a block, from the lesson's own words."""
    context = context or {}
    title = (context.get("title") or context.get("supportingTitle") or context.get("smallHeader")
             or query or "").strip()
    title = title[:1].upper() + title[1:]
    description = (context.get("description") or context.get("supportingDescription")
                   or context.get("nearbyText") or "")
    points = points_from(description)
    if not points and context.get("nearbyList"):
        points = [_shorten(text, 220) for text in context["nearbyList"][:MAX_POINTS]]
    return title, points, list(context.get("items") or [])


def draw_and_store_figure(query: str, context: dict | None = None) -> str | None:
    """Draws the block's figure, stores it, and returns its storage key -- or None."""
    try:
        from app.storage.s3_client import upload_object_bytes

        title, points, items = figure_content(query, context)
        if not title:
            return None
        key = f"{STORAGE_PREFIX}/{uuid.uuid4().hex}.svg"
        upload_object_bytes(key, draw_figure(title, points, items).encode("utf-8"), "image/svg+xml")
        return key
    except Exception as error:  # storage down, bad text: the block keeps no picture
        logger.warning("Could not draw a figure for %r: %s", query, error)
        return None
