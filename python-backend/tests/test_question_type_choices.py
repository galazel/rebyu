from app.graphs.certification.nodes import requested_question_types
from app.services.assessment_persistence import _WORKSPACE_TYPES


def test_programming_and_diagram_are_separate_choices():
    assert requested_question_types({"requested_question_types": ["PROGRAMMING"]}) == "PROGRAMMING"
    assert requested_question_types({"requested_question_types": ["DIAGRAM"]}) == "DIAGRAM"
    assert requested_question_types({"requested_question_types": ["MCQ", "DIAGRAM"]}) == "MCQ, DIAGRAM"


def test_the_old_combined_choice_still_means_both():
    assert requested_question_types({"requested_question_types": ["CRITICAL_THINKING"]}) == "PROGRAMMING, DIAGRAM"


def test_both_are_stored_as_critical_thinking():
    assert {"PROGRAMMING", "DIAGRAM"} <= _WORKSPACE_TYPES
