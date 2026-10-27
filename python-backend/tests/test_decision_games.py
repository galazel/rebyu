from app.ai.tutor_widgets import normalize


def test_story_has_valid_references_distinct_outcomes_and_no_cycles():
    story = {"start_id": "start", "nodes": [
        {"id": "start", "text": "You want to reuse software.", "choices": [{"text": "Obtain a licence", "next_id": "licensed"}, {"text": "Copy without permission", "next_id": "violation"}]},
        {"id": "licensed", "text": "You can reuse it under the licence terms."},
        {"id": "violation", "text": "You risk copyright infringement."},
    ]}
    story["nodes"][0]["choices"][0]["next_id"] = "decision0"
    story["nodes"][0]["choices"][1]["next_id"] = "decision0"
    story["nodes"].extend({"id": f"decision{i}", "text": f"Decision {i}", "choices": [
        {"text": "Option A", "next_id": f"decision{i+1}" if i < 8 else "licensed"},
        {"text": "Option B", "next_id": f"decision{i+1}" if i < 8 else "violation"}]} for i in range(9))
    result = normalize("show_branching_story", story)
    assert result["startId"] == "start"
    assert len(result["nodes"]) == 12
    story["nodes"][0]["choices"][0]["next_id"] = "missing"
    assert normalize("show_branching_story", story) is None
    story["nodes"][0]["choices"][0]["next_id"] = "start"
    assert normalize("show_branching_story", story) is None


def test_simulation_requires_an_achievable_legal_path():
    simulation = {"resources": [{"name": "Budget", "initial": 100, "minimum": 0}, {"name": "Quality", "initial": 0, "minimum": 0}], "target_resource": "Quality", "target_minimum": 8, "rounds": [
        {"situation": "Choose training", "choices": [{"text": "Training", "effects": [{"resource": "Budget", "delta": -60}, {"resource": "Quality", "delta": 6}]}, {"text": "Save", "effects": []}]},
        {"situation": "Choose a review", "choices": [{"text": "Review", "effects": [{"resource": "Budget", "delta": -30}, {"resource": "Quality", "delta": 3}]}, {"text": "Skip", "effects": []}]},
    ]}
    simulation["rounds"].extend({"situation": f"Review milestone {i}", "choices": [{"text": "Keep the plan", "effects": []}, {"text": "Review again", "effects": []}]} for i in range(8))
    assert normalize("show_simulation", simulation)["targetResource"] == "Quality"
    simulation["target_minimum"] = 100
    assert normalize("show_simulation", simulation) is None
    simulation["target_minimum"] = 8
    simulation["rounds"][0]["choices"][0]["effects"][0]["resource"] = "Unknown"
    assert normalize("show_simulation", simulation) is None


def test_two_truths_requires_three_distinct_statements_and_one_false_index():
    round_ = {"statements": ["A", "B", "C"], "false_index": 2, "explanation": "C is false."}
    assert normalize("show_two_truths_lie", {"rounds": [round_] * 10})["rounds"][0]["falseIndex"] == 2
    for invalid in (-1, 3, True, "2"):
        assert normalize("show_two_truths_lie", {"rounds": [{**round_, "false_index": invalid}, *[round_] * 9]}) is None
    assert normalize("show_two_truths_lie", {"rounds": [{**round_, "statements": ["A", "A", "C"]}, *[round_] * 9]}) is None
