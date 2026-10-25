import pytest

from app.domain.tutor_conduct import classify, conduct_directive


@pytest.mark.parametrize("message, kind", [
    ("the answer is plan do check act", "ok"),
    ("I think the CEO sets strategy", "ok"),
    ("this is so fucking hard", "profanity"),
    ("sh!t I forgot", "profanity"),
    ("putang ina naman", "profanity"),
    ("gago ka ba", "profanity"),
    ("you're so stupid", "insult"),
    ("bobo ka", "insult"),
    ("shut up already", "insult"),
    ("send nudes", "sexual"),
    ("i will kill you", "threat"),
    ("i want to die", "distress"),
    ("gusto ko nang mamatay", "distress"),
])
def test_classify(message, kind):
    assert classify(message).kind == kind


def test_words_inside_other_words_are_not_flagged():
    # "class", "assess", "scrap", "cocktail" must not trip the filter.
    assert classify("we assess the class scrapbook").kind == "ok"


def test_directive_escalates_with_strikes():
    conduct = classify("wtf")
    first, second, third = (conduct_directive(conduct, n) for n in (1, 2, 3))
    assert "FIRST" in first and "SECOND" in second and "THREE" in third
    assert conduct_directive(conduct, 9) == third


def test_distress_is_never_a_scolding():
    directive = conduct_directive(classify("i want to kill myself"), 3)
    assert "Do NOT scold" in directive and "1553" in directive


def test_clean_answer_has_no_conduct_directive():
    assert conduct_directive(classify("matrix structure"), 0) == ""
