"""The layout reader's repairs to the layout model's reading, on hand-built
blocks -- no Docling needed. Each case is a way a real reviewer went wrong."""

from app.papers.convert import is_document
from app.papers.layout_reader import (
    _answer_key,
    _attach_lone_headings,
    _covered,
    _merged_slice,
    _read_with,
    _real_blocks,
    _two_column_order,
    CHOICE_STYLES,
    QUESTION_STYLES,
)


def text(t, box, page=1):
    return {"kind": "text", "label": "text", "text": t, "page": page, "box": box}


def read(blocks, q="12.", c="A."):
    q_re = dict(QUESTION_STYLES)[q]
    c_re, case = next((r, case) for name, r, case in CHOICE_STYLES if name == c)
    return _read_with(blocks, q_re, c_re, case)


def test_misprinted_heading_does_not_swallow_the_rest():
    # "19 The following ..." -- no stop after the number (AFA reviewer, Q19).
    blocks = [text("1. Which fertilizer? A. Night soil B. Manure C. Mulch D. Compost", [0.1, 0.1, 0.9, 0.2]),
              text("2 The following are true EXCEPT A. one B. two C. three D. four", [0.1, 0.2, 0.9, 0.3]),
              text("3. Which soil? A. Clay B. Silt C. Loam D. Sand", [0.1, 0.3, 0.9, 0.4])]
    questions = read(blocks)
    assert [q["num"] for q in questions] == ["1", "2", "3"]
    assert all(len(q["options"]) == 4 and not q["issues"] for q in questions)


def test_one_unreadable_heading_costs_one_question():
    blocks = [text("1. First? A. a1 B. b1", [0.1, 0.1, 0.9, 0.2]),
              text("@@ smudged heading", [0.1, 0.2, 0.9, 0.25]),
              text("A. a2 B. b2", [0.1, 0.25, 0.9, 0.3]),
              text("3. Third? A. a3 B. b3", [0.1, 0.3, 0.9, 0.4])]
    questions = read(blocks)
    assert [q["num"] for q in questions] == ["1", "3"]
    # Question 1 is not silently given question 2's choices.
    assert any("unreadable" in issue for issue in questions[0]["issues"])


def test_six_and_eight_choices():
    letters = "ABCDEFGH"
    body = " ".join(f"{letters[k]}. choice {k}" for k in range(8))
    questions = read([text(f"1. Pick one? {body}", [0.1, 0.1, 0.9, 0.3]),
                      text("2. Next? A. x B. y C. z D. w E. v F. u", [0.1, 0.3, 0.9, 0.5])])
    assert [len(q["options"]) for q in questions] == [8, 6]


def test_answer_key_heading_joined_with_answers():
    body, key = _answer_key([text("1. Q? A. a B. b", [0, 0, 1, 0.1]),
                             text("ANSWER KEY 1. B 2. D 3. A", [0, 0.9, 1, 1])])
    assert key == {"1": "b", "2": "d", "3": "a"} and len(body) == 1


def test_answer_key_heading_inside_a_choice_block():
    body, key = _answer_key([text("D. Manual irrigation ANSWER KEY 1. B 2. D 3. A", [0, 0.9, 1, 1])])
    assert key == {"1": "b", "2": "d", "3": "a"}
    assert body[0]["text"] == "D. Manual irrigation"


def test_a_wrapped_title_ending_in_answer_is_not_the_key():
    blocks = [text("REVIEW EXAMINATION -- choose the best", [0, 0.05, 1, 0.07]),
              text("answer.", [0, 0.07, 1, 0.09]),
              text("1. Which? A. one B. two", [0, 0.1, 1, 0.2]),
              text("2. Which? A. one B. two", [0, 0.2, 1, 0.3]),
              text("Answer Key", [0, 0.8, 1, 0.82]),
              text("1. B 2. A 3. C", [0, 0.82, 1, 0.85])]
    body, key = _answer_key(blocks)
    assert len(body) == 4 and key == {"1": "b", "2": "a", "3": "c"}


def test_inline_answer_is_not_mistaken_for_a_key():
    body, key = _answer_key([text("1. Q? A. a B. b Answer: B", [0, 0, 1, 0.1])])
    assert key == {} and len(body) == 1


def test_watermark_letters_are_not_text():
    lines = [("1. Which statement best describes", [0.08, 0.30, 0.45, 0.32]),
             ("C. Internal database indexing", [0.10, 0.36, 0.40, 0.38])]
    phantom = text("SAMPLE", [0.25, 0.29, 0.53, 0.49])
    real = text("1. Which statement best describes", [0.08, 0.30, 0.45, 0.32])
    assert _real_blocks([real, phantom], lines) == [real]


def test_duplicate_blocks_are_read_once():
    lines = [("A. Secondary encryption keys", [0.1, 0.91, 0.4, 0.93])]
    a = text("A Secondary encryption keys", [0.1, 0.91, 0.4, 0.93])
    b = text("A. Secondary encryption keys", [0.1, 0.91, 0.4, 0.93])
    assert _real_blocks([a, b], lines) == [a]


def test_merged_slice_across_questions():
    q8 = text("8. Which?", [0.08, 0.10, 0.80, 0.18])
    q9 = text("9. Which?", [0.08, 0.21, 0.87, 0.29])
    slice_ = text("Answer: D Answer: C", [0.10, 0.18, 0.19, 0.42])
    assert _merged_slice(slice_, [q8, q9, slice_])
    assert not _merged_slice(q9, [q8, q9, slice_])


def test_two_column_order_reads_left_then_right_in_bands():
    title = text("TITLE", [0.1, 0.02, 0.9, 0.05])
    l1, l2 = text("L1", [0.06, 0.1, 0.45, 0.2]), text("L2", [0.06, 0.7, 0.45, 0.8])
    r1 = text("R1", [0.53, 0.1, 0.9, 0.2])
    wide = text("WIDE", [0.06, 0.85, 0.94, 0.88])
    l3 = text("L3", [0.06, 0.9, 0.45, 0.95])
    order = _two_column_order([r1, l2, wide, title, l3, l1])
    assert [b["text"] for b in order] == ["TITLE", "L1", "L2", "R1", "WIDE", "L3"]


def test_number_in_its_own_table_cell_joins_its_question():
    blocks = [text("1.", [0.15, 0.30, 0.16, 0.32]),
              text("2.", [0.15, 0.42, 0.16, 0.43]),
              text("Which is first?", [0.50, 0.30, 0.82, 0.32]),
              text("A. x", [0.50, 0.33, 0.70, 0.35]),
              text("Which is second?", [0.50, 0.42, 0.82, 0.43])]
    joined = _attach_lone_headings(blocks)
    assert [b["text"] for b in joined] == ["1. Which is first?", "A. x", "2. Which is second?"]


def test_covered_needs_shared_width_and_half_the_height():
    assert _covered([0.1, 0.10, 0.3, 0.12], [[0.0, 0.09, 0.5, 0.13]])
    assert not _covered([0.53, 0.26, 0.58, 0.27], [[0.53, 0.24, 0.6, 0.26]])  # the line below
    assert not _covered([0.6, 0.10, 0.8, 0.12], [[0.0, 0.09, 0.5, 0.13]])  # other column


def test_word_documents_are_recognised_by_content():
    assert is_document(b"PK\x03\x04rest-of-a-docx")
    assert is_document(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1legacy-doc")
    assert is_document(b"{\\rtf1\\ansi}")
    assert not is_document(b"%PDF-1.7")
    assert not is_document(b"MZ\x90\x00executable")


def test_a_placeholder_lesson_is_rejected_at_generation_time():
    """A free model answered the real lesson prompt with "Test Lesson" and one
    heading -- every schema anatomy check passed it."""
    import pytest

    from app.ai.invocation import ThinGeneration, _require_depth
    from app.schemas.certification.lesson_schema import GeneratedLesson

    base = {
        "title": "Test Lesson",
        "introduction": "This is a test introduction that is long enough to meet the forty character requirement.",
        "learning_objectives": ["Understand the basics of TCP/IP."],
        "summary": "This is a test summary that is long enough to meet the forty character requirement.",
    }
    with pytest.raises(ThinGeneration):
        _require_depth(GeneratedLesson(**base, sections=[{"type": "heading", "data": {"text": "Test Heading"}}]))
    real = [{"type": "description", "data": {"text": f"Paragraph {i}"}} for i in range(12)]
    _require_depth(GeneratedLesson(**base, sections=real))  # a real lesson passes
    _require_depth({"not": "a lesson"})  # other agents' outputs are untouched
