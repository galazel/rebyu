"""Figures drawn for lesson blocks that no real image fits.

The hand-made lesson figures first shipped with notes that ran off both edges:
SVG text never wraps, and a one-line footer longer than the figure was simply
cut off. These pin the rule the drawn figures follow instead -- every line is
broken to fit its box before it is drawn.
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ElementTree

from app.domain import lesson_figures
from app.domain.lesson_figures import (GLYPH_WIDTH, WIDTH, draw_and_store_figure, draw_figure,
                                       figure_content, points_from, wrap_lines)

LONG = ("Sixteen elements need at most four comparisons, and a million need at most twenty. "
        "The array MUST already be sorted -- binary search on unsorted data does not run slowly, "
        "it returns wrong answers.")


def test_no_wrapped_line_is_wider_than_its_box():
    for size in (15, 22):
        for line in wrap_lines(LONG, 700, size):
            assert len(line) * size * GLYPH_WIDTH <= 700


def test_a_single_overlong_word_is_split_rather_than_overflowing():
    lines = wrap_lines("x" * 300, 200, 15)
    assert len(lines) > 1 and all(len(line) * 15 * GLYPH_WIDTH <= 200 for line in lines)


def test_the_drawn_figure_is_valid_svg_and_keeps_every_line_inside_the_figure():
    svg = draw_figure("Binary search for 23 in a sorted array of 16 " * 2, points_from(LONG))

    ElementTree.fromstring(svg)
    for x, size, body in re.findall(r'<text x="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)</text>', svg):
        if body.isdigit():
            continue  # the step numbers, centred in their circles
        assert float(x) + len(body) * float(size) * GLYPH_WIDTH <= WIDTH - 20, body


def test_points_are_the_descriptions_sentences_capped_at_five():
    text = "One. Two. Three. Four. Five. Six."
    assert points_from(text) == ["One.", "Two.", "Three.", "Four.", "Five."]


def test_the_blocks_title_heads_the_figure_before_the_query():
    title, points, items = figure_content("cache levels", {"title": "memory hierarchy", "description": "Small is fast."})
    assert title == "Memory hierarchy"
    assert points == ["Small is fast."]
    assert items == []


def test_a_block_with_items_is_drawn_as_a_grid_of_labelled_boxes():
    items = [{"title": "Confidentiality", "description": "Only the right people can read it."},
             {"title": "Integrity", "description": "Nobody can change it unnoticed."},
             {"title": "Availability", "description": "It is there when it is needed."}]

    svg = draw_figure("The CIA triad", [], items)

    ElementTree.fromstring(svg)
    assert all(item["title"] in svg for item in items)
    assert svg.count('rx="14"') == 3, "one box per item"
    for x, size, body in re.findall(r'<text x="([\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)</text>', svg):
        assert float(x) + len(body) * float(size) * GLYPH_WIDTH <= WIDTH - 20, body


def test_a_bare_image_block_uses_the_list_before_it_as_steps():
    title, points, items = figure_content("sdlc", {"nearbyList": ["Plan the work", "Build it", "Test it"]})
    assert points == ["Plan the work", "Build it", "Test it"]
    assert "Build it" in draw_figure(title, points, items)


def test_a_stored_figure_goes_to_storage_as_svg(monkeypatch):
    stored = {}

    def upload(key, content, content_type):
        stored.update(key=key, content=content, content_type=content_type)

    import app.storage.s3_client as s3_client
    monkeypatch.setattr(s3_client, "upload_object_bytes", upload)

    key = draw_and_store_figure("normal forms", {"description": "1NF removes repeating groups."})

    assert key == stored["key"] and key.startswith(lesson_figures.STORAGE_PREFIX + "/") and key.endswith(".svg")
    assert stored["content_type"] == "image/svg+xml"
    assert b"repeating groups" in stored["content"]


def test_storage_failure_returns_none_instead_of_raising(monkeypatch):
    import app.storage.s3_client as s3_client

    def broken(key, content, content_type):
        raise RuntimeError("bucket unreachable")

    monkeypatch.setattr(s3_client, "upload_object_bytes", broken)
    assert draw_and_store_figure("normal forms") is None
