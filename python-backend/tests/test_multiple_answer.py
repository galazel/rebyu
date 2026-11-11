import random

import pytest
from pydantic import ValidationError

from app.domain.choice_order import shuffle_choices
from app.schemas.certification.question_schema import QuestionDraft

EXPLAIN = "This option is explained well enough for a learner to follow it."


def _draft(**overrides):
    base = dict(
        question_type="MULTIPLE_ANSWER",
        question="Which two statements about TCP are true? (Choose two.)",
        explanation="TCP is connection-oriented and retransmits lost segments.",
        choices=["It is connection-oriented", "It is connectionless",
                 "It retransmits lost segments", "It has no headers", "It is a layer 2 protocol"],
        correct_choice_indices=[2, 0],
        choice_explanations=[EXPLAIN] * 5,
    )
    base.update(overrides)
    return QuestionDraft(**base)


def test_valid_multiple_answer_is_normalised():
    draft = _draft()
    assert draft.correct_choice_indices == [0, 2]
    assert draft.correct_choice_index is None


@pytest.mark.parametrize("overrides", [
    {"correct_choice_indices": [1]},                       # one right: that is an MCQ
    {"correct_choice_indices": [0, 7]},                    # out of range
    {"correct_choice_indices": [0, 1, 2, 3]},              # only one wrong option left
    {"choices": ["a", "b", "c"], "choice_explanations": [EXPLAIN] * 3},  # too few
    {"choice_explanations": [EXPLAIN] * 4},                # explanations misaligned
])
def test_invalid_multiple_answer_is_rejected(overrides):
    with pytest.raises(ValidationError):
        _draft(**overrides)


def test_shuffle_keeps_right_options_right():
    question = _draft().model_dump()
    right_texts = {question["choices"][i] for i in question["correct_choice_indices"]}
    for seed in range(20):
        shuffled = shuffle_choices(question, random.Random(seed))
        assert {shuffled["choices"][i] for i in shuffled["correct_choice_indices"]} == right_texts
        for i, text in enumerate(shuffled["choices"]):
            original = question["choices"].index(text)
            assert shuffled["choice_explanations"][i] == question["choice_explanations"][original]
