"""Static check of a content module: no database, no container needed.

Mirrors the assertions in builders.mcq plus a duplicate-stem check, so a bad
batch is caught before it reaches a seeding run.
"""
import ast
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "content_ip_gap_03.py"
tree = ast.parse(open(path, encoding="utf-8").read())
print("syntax OK:", path)

calls = [n for n in ast.walk(tree)
         if isinstance(n, ast.Call) and getattr(n.func, "id", "") == "mcq"]
print("mcq calls:", len(calls))

problems = 0
seen = {}
for call in calls:
    difficulty = call.args[0].value
    stem = call.args[1].value
    choices = call.args[2].elts
    explanation = call.args[3].value
    correct = sum(1 for c in choices if c.elts[1].value is True)

    if difficulty not in ("EASY", "AVERAGE", "HARD"):
        print("  bad difficulty %r: %s" % (difficulty, stem[:50])); problems += 1
    if len(choices) != 4:
        print("  %d choices: %s" % (len(choices), stem[:50])); problems += 1
    if correct != 1:
        print("  %d correct: %s" % (correct, stem[:50])); problems += 1
    if not explanation.strip():
        print("  no explanation: %s" % stem[:50]); problems += 1

    texts = [c.elts[0].value for c in choices]
    if len(set(texts)) != len(texts):
        print("  repeated choice text: %s" % stem[:50]); problems += 1
    seen[stem] = seen.get(stem, 0) + 1

for stem, count in seen.items():
    if count > 1:
        print("  DUPLICATE stem x%d: %s" % (count, stem[:60])); problems += 1

# Per-lesson counts, read straight off the dict literal.
for node in ast.walk(tree):
    if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", "") == "QUESTIONS":
        for key, value in zip(node.value.keys, node.value.values):
            print("  lesson %s: %d questions" % (key.value, len(value.elts)))

print("problems:", problems)
sys.exit(1 if problems else 0)
