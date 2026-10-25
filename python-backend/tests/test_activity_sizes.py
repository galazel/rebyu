import pytest
from app.ai.tutor_widgets import normalize, activity_item_count, requested_activity_count, activity_token_budget

WORDS = "COST INCOME CAPITAL BUDGET PROFIT REVENUE ASSET DEBT LICENSE PATENT COPYRIGHT MARKET TRADE SECRET SOFTWARE NETWORK SERVER CLIENT DATABASE MEMORY".split()


def activity_args(tool, count):
    cards = [{"front": f"Question {i}", "back": f"Answer {i}"} for i in range(count)]
    if tool in ("show_flashcards", "show_speed_flashcards"):
        return {"cards": cards}
    if tool == "show_quiz":
        return {"questions": [{"question": f"Question {i}", "options": ["A", "B"], "correct_index": 0} for i in range(count)]}
    if tool == "show_matching":
        return {"pairs": [{"term": f"Term {i}", "match": f"Definition {i}"} for i in range(count)]}
    if tool == "show_ordering":
        return {"items": [f"Step {i}" for i in range(count)]}
    if tool == "show_fill_blank":
        return {"blanks": [{"sentence": f"Complete statement {i}: ___", "answer": str(i)} for i in range(count)]}
    if tool == "show_true_false":
        return {"claims": [{"statement": f"Statement {i}", "is_true": True} for i in range(count)]}
    if tool == "show_sorting":
        return {"groups": [{"name": "A", "items": [f"A {i}" for i in range(count // 2)]}, {"name": "B", "items": [f"B {i}" for i in range(count - count // 2)]}]}
    if tool == "show_word_game":
        return {"variant": "crossword", "words": [{"word": word, "clue": f"Clue for {word}"} for word in WORDS[:count]]}
    if tool == "show_branching_story":
        nodes = [{"id": f"n{i}", "text": f"Situation {i}", "choices": [{"text": "A", "next_id": f"n{i+1}" if i < count - 1 else "endA"}, {"text": "B", "next_id": f"n{i+1}" if i < count - 1 else "endB"}]} for i in range(count)]
        return {"start_id": "n0", "nodes": nodes + [{"id": "endA", "text": "Outcome A"}, {"id": "endB", "text": "Outcome B"}]}
    if tool == "show_simulation":
        return {"resources": [{"name": "Budget", "initial": 100, "minimum": 0}, {"name": "Quality", "initial": 0, "minimum": 0}], "target_resource": "Quality", "target_minimum": count,
                "rounds": [{"situation": f"Decision {i}", "choices": [{"text": "Improve", "effects": [{"resource": "Budget", "delta": -1}, {"resource": "Quality", "delta": 1}]}, {"text": "Save", "effects": []}]} for i in range(count)]}
    return {"rounds": [{"statements": [f"A {i}", f"B {i}", f"C {i}"], "false_index": 2} for i in range(count)]}


TOOLS = ["show_quiz", "show_flashcards", "show_speed_flashcards", "show_matching", "show_ordering", "show_fill_blank", "show_true_false", "show_sorting", "show_word_game", "show_branching_story", "show_simulation", "show_two_truths_lie"]


@pytest.mark.parametrize("tool", TOOLS)
@pytest.mark.parametrize("count", [10, 15, 20])
def test_every_activity_accepts_exact_requested_count(tool, count):
    result = normalize(tool, activity_args(tool, count), expected_count=count)
    assert result is not None, tool
    assert activity_item_count(result) == count


@pytest.mark.parametrize("tool", TOOLS)
def test_fewer_than_ten_or_wrong_requested_count_cannot_be_delivered(tool):
    assert normalize(tool, activity_args(tool, 9)) is None
    assert normalize(tool, activity_args(tool, 10), expected_count=20) is None


def test_requested_counts_default_to_ten_and_ignore_timer_numbers():
    assert requested_activity_count("Create flashcards based on this lesson.") == 10
    assert requested_activity_count("Create a flashcard speed round with 15 seconds per card. Include exactly 20 flashcards.") == 20
    assert requested_activity_count("Create a branching story. Include exactly 20 decision points.") == 20
    assert requested_activity_count("Create a quiz with 9 questions") == 9
    assert requested_activity_count("Create a quiz with 21 questions") == 21
    assert requested_activity_count("Explain 24 subnet masks") is None


def test_large_activities_get_enough_output_budget_without_changing_plain_chat():
    assert activity_token_budget("show_quiz", 20) >= 6000
    assert activity_token_budget("show_simulation", 20) >= 10000
    assert activity_token_budget("show_branching_story", 10) >= 6000
    assert activity_token_budget(None, None) is None
