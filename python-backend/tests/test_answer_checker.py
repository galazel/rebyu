from app.papers.answer_checker import _clean, _parse
from app.papers.page_reader import _parse as parse_page


QUESTION = {
    "id": "12",
    "stem": "Which is true for the DMA controller?",
    "options": [{"key": "a", "text": "x"}, {"key": "b", "text": "between the cash memory"}],
    "answer": "a",
}


def test_disagreement_and_fixes_are_kept():
    results = _parse('```json\n{"results": [{"id": "12", "answer": "B", "confidence": "high", '
                     '"reason": "r", "stem": null, "options": {"b": "between the cache memory", "z": "nope"}, '
                     '"fixes": ["cash -> cache"]}]}\n```')
    cleaned = _clean(results[0], QUESTION)
    assert cleaned["answer"] == "b"
    assert cleaned["agrees"] is False
    assert cleaned["options"] == {"b": "between the cache memory"}
    assert cleaned["stem"] is None


def test_unknown_answer_key_is_dropped():
    cleaned = _clean({"id": "12", "answer": "e", "confidence": "sure"}, QUESTION)
    assert cleaned["answer"] is None and cleaned["agrees"] is None and cleaned["confidence"] == "low"


def test_page_reader_keeps_types_subquestions_and_written_answers():
    page = parse_page('{"questions": ['
                      '{"id": "3-1", "type": "short_answer", "parentId": "3", "context": "Table T", "stem": "Name it"},'
                      '{"id": "4", "type": "descriptive", "stem": "s", "options": [{"key": "a", "text": "x"}, {"key": "b", "text": "y"}]}],'
                      '"answers": {"3-1": "Normalization", "4": "b"}}', set())
    first, second = page["questions"]
    assert (first["type"], first["parentId"], first["context"]) == ("short_answer", "3", "Table T")
    assert second["type"] == "mcq"  # printed choices always mean multiple choice
    assert page["answers"] == {"4": "b"} and page["answerTexts"] == {"3-1": "Normalization"}
