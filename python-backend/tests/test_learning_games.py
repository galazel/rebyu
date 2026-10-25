from app.ai.tutor_widgets import TOOLS, normalize, requested_tool


def test_direct_picker_requests_choose_the_right_tools():
    for message, tool in [
        ("Create a sorting and categorizing game", "show_sorting"),
        ("Create a word search", "show_word_game"),
        ("Create a crossword", "show_word_game"),
        ("Create hangman", "show_word_game"),
        ("Create unscramble", "show_word_game"),
        ("Create a branching story", "show_branching_story"),
        ("Create a simulation", "show_simulation"),
        ("Create two truths and a lie", "show_two_truths_lie"),
        ("Create a flashcard speed round", "show_speed_flashcards"),
        ("Sequence these process steps", "show_ordering"),
    ]:
        assert requested_tool(message) == tool
    assert {"show_sorting", "show_word_game", "show_branching_story", "show_simulation", "show_two_truths_lie", "show_speed_flashcards"} <= {tool.__name__ for tool in TOOLS}
    assert not {"show_puzzle", "show_visual_game"} & {tool.__name__ for tool in TOOLS}


def test_sorting_rejects_duplicate_group_names_and_ambiguous_items():
    result = normalize("show_sorting", {"groups": [{"name": "Fixed", "items": ["Rent", *[f"Fixed {i}" for i in range(8)]]}, {"name": "Variable", "items": ["Materials", "Rent"]}]})
    assert result["groups"][1]["items"] == ["Materials"]
    assert normalize("show_sorting", {"groups": [{"name": "Same", "items": ["A"]}, {"name": "Same", "items": ["B"]}]}) is None


def test_word_game_validation():
    for variant in ("word_search", "crossword", "hangman", "unscramble"):
        result = normalize("show_word_game", {"variant": variant, "words": [{"word": word, "clue": f"Clue {i}"} for i, word in enumerate(["cost", "income", "asset", "debt", "budget", "profit", "trade", "patent", "license", "market"])]})
        assert result["words"][0]["word"] == "COST"
        assert result["variant"] == variant
    assert normalize("show_word_game", {"variant": "arbitrary", "words": []}) is None
    assert normalize("show_word_game", {"variant": "hangman", "words": [{"word": "cost", "clue": "A"}, {"word": "COST", "clue": "B"}]}) is None


def test_puzzle_requires_a_complete_diagram():
    assert normalize("show_puzzle", {"variant": "sliding", "labels": [str(i) for i in range(9)]})["type"] == "puzzle"
    assert normalize("show_puzzle", {"variant": "jigsaw", "labels": ["One"]}) is None


def test_visual_targets_must_exist_and_differences_must_really_differ():
    objects = [{"label": str(i), "symbol": "A", "changed_symbol": "B" if i == 0 else "A", "position": i} for i in range(6)]
    result = normalize("show_visual_game", {"variant": "spot_difference", "objects": objects, "targets": ["fake"]})
    assert result["targets"] == ["0"]
    assert normalize("show_visual_game", {"variant": "hidden_objects", "objects": objects, "targets": ["fake"]}) is None


def test_speed_round_has_bounded_timer_and_cards():
    result = normalize("show_speed_flashcards", {"seconds": 900, "cards": [{"front": f"Card {i}", "back": f"Answer {i}"} for i in range(10)]})
    assert result["seconds"] == 60
    assert result["type"] == "speed_flashcards"
