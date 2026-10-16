"""Flags generated questions that are too close to a past-paper question.

    python check_copy.py generated.jsonl [reference.jsonl] [threshold]

`generated.jsonl` holds one model reply per line (the JSON the model emits).
No dependencies, so it runs as-is in Colab. Similarity is the share of the
generated stem's word 5-grams that also appear in a reference stem; 0.30 or
more is treated as a copy. Training alone does not stop a model reproducing
what it saw -- this gate does.
"""

import json
import re
import sys
from collections import defaultdict

N = 5


def grams(text):
    words = re.findall(r"\w+", text.lower())
    return {tuple(words[i:i + N]) for i in range(len(words) - N + 1)}


def main():
    gen_path = sys.argv[1]
    ref_path = sys.argv[2] if len(sys.argv) > 2 else "reference.jsonl"
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.30

    refs, index = [], defaultdict(set)
    for line in open(ref_path, encoding="utf-8"):
        r = json.loads(line)
        refs.append(r)
        for g in grams(r["question"]):
            index[g].add(len(refs) - 1)

    flagged = total = 0
    for n, line in enumerate(open(gen_path, encoding="utf-8"), 1):
        try:
            q = json.loads(line)["question"]
        except (ValueError, KeyError, TypeError):
            print("line %d: not valid question JSON" % n)
            continue
        total += 1
        g = grams(q)
        if not g:
            continue
        hits = defaultdict(int)
        for x in g:
            for i in index.get(x, ()):
                hits[i] += 1
        if hits:
            best, count = max(hits.items(), key=lambda kv: kv[1])
            score = count / len(g)
            if score >= threshold:
                flagged += 1
                print("line %d: %.0f%% overlap with %s" % (n, score * 100, refs[best]["source"]))
    print("%d / %d flagged as copies" % (flagged, total))


if __name__ == "__main__":
    main()
