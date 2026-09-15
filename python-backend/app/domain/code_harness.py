"""The harness the grader wraps a learner's Python code in.

A copy of `CodeExecutionService.PYTHON_TEST_HARNESS` in the Java backend, kept
here so generation can run a question's reference solution *exactly* the way a
learner's submission will be graded -- and so the expected outputs it stores are
the ones the grader will compare against. `tests/test_code_harness.py` fails if
the two copies drift apart.

How a test input is run (identical in both copies):

* If it parses as Python and contains a call, it is test code: the solution is
  loaded with its own prints silenced, the test's statements run in the same
  namespace, and the value of a final bare expression is printed, like the
  Python prompt.
* Anything else is plain data, fed to the solution on stdin.
"""

from __future__ import annotations

import base64

LEARNER_SOURCE_PLACEHOLDER = "__LEARNER_SOURCE__"

PYTHON_TEST_HARNESS = r'''import ast, base64, contextlib, io, sys
_rebyu_source = base64.b64decode("__LEARNER_SOURCE__").decode("utf-8")
_rebyu_data = sys.stdin.read()

def _rebyu_test_tree(text):
    try:
        tree = ast.parse(text.strip())
    except SyntaxError:
        return None
    return tree if any(isinstance(node, ast.Call) for node in ast.walk(tree)) else None

_rebyu_tree = _rebyu_test_tree(_rebyu_data)
if _rebyu_tree is None:
    sys.stdin = io.StringIO(_rebyu_data)
    exec(compile(_rebyu_source, "main.py", "exec"), {"__name__": "__main__"})
else:
    _rebyu_ns = {"__name__": "solution"}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(_rebyu_source, "main.py", "exec"), _rebyu_ns)
    _rebyu_body = _rebyu_tree.body
    if _rebyu_body and isinstance(_rebyu_body[-1], ast.Expr):
        # Like the Python prompt: the statements run, and the value of
        # a final bare expression is printed.
        exec(compile(ast.Module(body=_rebyu_body[:-1], type_ignores=[]), "test.py", "exec"), _rebyu_ns)
        _rebyu_value = eval(compile(ast.Expression(_rebyu_body[-1].value), "test.py", "eval"), _rebyu_ns)
        if _rebyu_value is not None:
            print(_rebyu_value)
    else:
        exec(compile(_rebyu_tree, "test.py", "exec"), _rebyu_ns)
'''


def wrap_python_source(source: str) -> str:
    """The program Judge0 runs for one Python submission."""
    encoded = base64.b64encode((source or "").encode("utf-8")).decode("ascii")
    return PYTHON_TEST_HARNESS.replace(LEARNER_SOURCE_PLACEHOLDER, encoded)
