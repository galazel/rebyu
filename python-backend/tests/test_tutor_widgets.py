from app.ai.tutor_widgets import (
    MAX_QUIZ_QUESTIONS,
    MIN_QUIZ_QUESTIONS,
    normalize,
    requested_quiz_count,
)


def _question(number: int) -> dict:
    return {
        "question": f"Question {number}?",
        "options": ["A", "B", "C", "D"],
        "correct_index": 0,
        "explanation": "Because A is correct.",
    }


def test_quiz_widget_accepts_the_documented_range_and_caps_at_twenty():
    widget = normalize("show_quiz", {"questions": [_question(i) for i in range(25)]})

    assert widget is not None
    assert len(widget["questions"]) == MAX_QUIZ_QUESTIONS


def test_quiz_widget_rejects_less_than_ten_valid_questions():
    widget = normalize("show_quiz", {"questions": [_question(i) for i in range(MIN_QUIZ_QUESTIONS - 1)]})

    assert widget is None


def test_requested_quiz_count_ignores_non_quiz_numbers():
    assert requested_quiz_count("Explain 24 subnet masks") is None
    assert requested_quiz_count("Generate a quiz with 20 questions") == 20
    assert requested_quiz_count("Give me a quiz with 21 questions") == 21


def test_quiz_widget_drops_duplicate_questions_and_answers():
    questions = [_question(i) for i in range(10)]
    questions[1]["question"] = questions[0]["question"]
    questions[2]["options"] = ["A", "A", "C"]

    assert normalize("show_quiz", {"questions": questions}) is None


def test_matching_and_flashcards_remove_repeated_prompts():
    matching = normalize("show_matching", {"pairs": [
        {"term": "TCP", "match": "Reliable transport"},
        {"term": " TCP ", "match": "Duplicate term"},
        {"term": "UDP", "match": "Connectionless transport"},
        {"term": "IP", "match": "Network routing"},
        *[{"term": f"Term {i}", "match": f"Definition {i}"} for i in range(7)],
    ]})
    flashcards = normalize("show_flashcards", {"cards": [
        {"front": "TCP", "back": "Reliable transport"},
        {"front": " TCP ", "back": "Duplicate"},
        {"front": "UDP", "back": "Connectionless transport"},
        {"front": "IP", "back": "Network routing"},
        *[{"front": f"Card {i}", "back": f"Answer {i}"} for i in range(7)],
    ]})

    assert matching is not None
    assert [pair["term"] for pair in matching["pairs"]][:3] == ["TCP", "UDP", "IP"]
    assert len(matching["pairs"]) == 10
    assert flashcards is not None
    assert [card["front"] for card in flashcards["cards"]][:3] == ["TCP", "UDP", "IP"]
    assert len(flashcards["cards"]) == 10
