"""Question builders for the bank expansion.

Deliberately narrower than `fe_expansion/builders.py`: that module builds
whole lessons (block palette, figures, tables) because it seeds curriculum.
This one only ever adds questions to lessons that already exist, so an MCQ
and its four choices is the entire vocabulary.

The one piece worth copying across is the answer-position balancing. Writing
an item you think of the right answer first and the distractors afterwards,
so the correct choice drifts to the top -- one hand-written FE batch came out
with the answer in slot two nine times in ten, which is a tell a candidate can
exploit while knowing none of the material. Slots are therefore assigned
round-robin across a batch, which makes the spread exact rather than merely
likely.
"""

DIFFICULTIES = ("EASY", "MEDIUM", "HARD")


def mcq(difficulty, question, choices, explanation):
    """choices: [(text, is_correct)], exactly four, exactly one correct."""
    assert difficulty in DIFFICULTIES, "bad difficulty %r" % (difficulty,)
    assert len(choices) == 4, "MCQ needs four choices: %r" % question[:70]
    correct = [c for c in choices if c[1]]
    assert len(correct) == 1, "MCQ needs exactly one correct choice: %r" % question[:70]
    assert explanation and explanation.strip(), "MCQ needs an explanation: %r" % question[:70]
    return {"type": "MCQ", "difficulty": difficulty, "question": question.strip(),
            "choices": list(choices), "explanation": explanation.strip()}


def balance_answer_positions(items, start=0):
    """Spreads the correct choice evenly over the four slots, in place.

    Round-robin over the batch rather than a per-question hash: a hash is
    even only on average and a 40-item batch is far too small for that to
    hold. Distractor order is otherwise preserved, which matters when they
    are graded values that read oddly out of sequence.

    `start` continues the rotation from where a previous list left off, and
    the new position is returned so a caller can thread it through. Without
    it, a module whose lessons hold two questions each would only ever use
    slots one and two -- every list restarting the rotation at zero -- which
    is a worse tell than the authoring bias this function exists to remove.
    """
    position = start
    for item in items:
        if item["type"] != "MCQ":
            continue
        choices = item["choices"]
        correct = next(c for c in choices if c[1])
        others = [c for c in choices if not c[1]]
        slot = position % 4
        item["choices"] = others[:slot] + [correct] + others[slot:]
        position += 1
    return position
