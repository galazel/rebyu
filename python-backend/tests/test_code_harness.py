"""The generator runs reference solutions through the grader's own harness.

Expected outputs stored with a coding question are what that question's
reference solution prints under `app.domain.code_harness`. If that copy drifted
from the Java grader's, generation would store outputs the grader never
reproduces -- the exact failure that marked every correct submission wrong.
"""

from __future__ import annotations

import ast
import contextlib
import io
import re
import sys
from pathlib import Path

import pytest

from app.domain.code_harness import PYTHON_TEST_HARNESS, wrap_python_source

JAVA_SERVICE = (
    Path(__file__).resolve().parents[2]
    / "backend-java/src/main/java/com/capstone/rebyu/execution/service/CodeExecutionService.java"
)


def _java_harness() -> str:
    source = JAVA_SERVICE.read_text(encoding="utf-8")
    block = re.search(r'PYTHON_TEST_HARNESS = """\n(.*?)""";', source, re.S).group(1)
    lines = block.split("\n")
    indent = min(len(line) - len(line.lstrip()) for line in lines if line.strip())
    return "\n".join(line[indent:] for line in lines)


@pytest.mark.skipif(not JAVA_SERVICE.exists(), reason="Java backend not checked out alongside")
def test_the_python_copy_matches_the_java_grader_exactly():
    assert PYTHON_TEST_HARNESS.strip() == _java_harness().strip()


def _run(solution: str, test_input: str) -> str:
    """Executes the wrapped program locally, the way Judge0 would, for these fixed tests."""
    out = io.StringIO()
    real_stdin = sys.stdin
    sys.stdin = io.StringIO(test_input)
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(wrap_python_source(solution), "harness.py", "exec"), {"__name__": "__main__"})
    finally:
        sys.stdin = real_stdin
    return out.getvalue().rstrip()


SOLUTION = "def double(n):\n    return n * 2\n\nprint('demo output the tests ignore')\n"


def test_a_single_call_prints_its_value_and_hides_the_solutions_own_prints():
    assert _run(SOLUTION, "double(21)") == "42"


def test_statements_ending_in_an_expression_print_that_expression():
    assert _run(SOLUTION, "values = [double(1), double(2)]\nvalues") == "[2, 4]"


def test_plain_data_is_fed_to_the_program_on_stdin():
    program = "import sys\nprint(int(sys.stdin.read()) * 2)\n"
    assert _run(program, "21") == "42"


def test_the_placeholder_is_replaced():
    wrapped = wrap_python_source(SOLUTION)
    assert "__LEARNER_SOURCE__" not in wrapped
    ast.parse(wrapped)
