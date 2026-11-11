import pytest
from pydantic import ValidationError

from app.schemas.certification.question_schema import QuestionBatch, QuestionDraft


def _coding(language, solution="print('ok')\n", **extra):
    return dict(question_type="PROGRAMMING", question="Report the totals.", rules="Print one line.",
                reference_solution=solution, programming_language=language, expected_output="ok",
                explanation="The totals come from summing the valid rows only.",
                common_mistake="Counting the malformed rows as valid.", **extra)


def test_sql_and_pseudocode_are_accepted():
    assert QuestionDraft(**_coding("SQL", "CREATE TABLE t(a); INSERT INTO t VALUES(1); SELECT a FROM t;")).programming_language == "SQL"
    assert QuestionDraft(**_coding("Pseudocode")).programming_language == "PSEUDOCODE"


def test_pseudocode_reference_must_be_python():
    with pytest.raises(ValidationError, match="not valid Python"):
        QuestionDraft(**_coding("PSEUDOCODE", "integer x <- 1\nprint x"))


def test_a_batch_of_coding_items_in_one_language_is_rejected():
    with pytest.raises(ValidationError, match="spread them across"):
        QuestionBatch(scope="s", questions=[QuestionDraft(**_coding("PYTHON")) for _ in range(3)])
    QuestionBatch(scope="s", questions=[QuestionDraft(**_coding(lang)) for lang in ("PYTHON", "PYTHON", "SQL")])
