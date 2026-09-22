"""Parses an FE Subject B paper (2024 onward) into structured questions.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/parse_subject_b.py 2025A_FE-B

Subject B is not Subject A with different content, and the Subject A parser
produces plausible-looking nonsense on it. Three structural differences:

  * The answer group runs to eight options, not four. Parsed as four, a
    question whose key is "g" loses its own answer, and one whose key is "c"
    keeps a correct-looking answer while silently dropping half the options.

  * Options are introduced by a literal "Answer group" heading rather than
    following straight on from the stem, and they are frequently a table with
    one column per blank (A, B) rather than a single value.

  * The stem usually contains a PROGRAM, whose indentation is its meaning.
    Flattened into a paragraph the question becomes unanswerable, so the
    listing's line structure is preserved and the region is rendered as an
    image as well.

Everything else -- figure detection, row grouping, the answer key reader --
is shared with the Subject A parser.
"""

import json
import os
import re
import sys

import pymupdf

from app.papers.subject_a import (  # noqa: E402
    FIGURE_PAD, OUT_DIR, PDF_DIR, answer_key, figure_rects, page_lines,
)

ANSWER_GROUP_RE = re.compile(r"^\s*Answer group\s*$", re.I)
QUESTION_RE = re.compile(r"^\s*Q(\d+)\.\s*(.*)$")
CHOICE_RE = re.compile(r"^\s*([a-j])\)\s*(.*)$")

#: Lines belonging to a program listing are recognised by their indentation
#: and by the vocabulary of the pseudo-code the paper uses. They are kept as
#: separate lines rather than joined into the surrounding prose.
PROGRAM_TOKENS = ("integer", "for (", "if (", "endif", "endfor", "while (",
                  "endwhile", "return", "output", "elseif", "else", "○",
                  "procedure", "function", "boolean", "string:", "real:")


def looks_like_program(line):
    stripped = line.strip()
    if not stripped:
        return False
    return (line.startswith("  ")
            or any(token in stripped for token in PROGRAM_TOKENS)
            or re.match(r"^[○●]", stripped) is not None)


def parse(name):
    questions_pdf = PDF_DIR + name + "_Questions.pdf"
    answers_pdf = None
    for suffix in ("_Answers.pdf", "_Answer.pdf"):
        if os.path.exists(PDF_DIR + name + suffix):
            answers_pdf = PDF_DIR + name + suffix
            break
    if answers_pdf is None:
        raise SystemExit("no answer key for " + name)

    key = answer_key(answers_pdf)
    doc = pymupdf.open(questions_pdf)

    per_page = {i: page_lines(doc[i]) for i in range(doc.page_count)}

    candidates = []
    for index, lines in per_page.items():
        for value, rect in lines:
            match = QUESTION_RE.match(value)
            if match:
                candidates.append((int(match.group(1)), index, rect.y0))

    first_two = next((c for c in candidates if c[0] == 2), None)
    ones = [c for c in candidates if c[0] == 1]
    if not ones:
        raise SystemExit("no Q1 found in " + name)
    if first_two is not None:
        before = [c for c in ones if (c[1], c[2]) < (first_two[1], first_two[2])]
        anchor = before[-1] if before else ones[0]
    else:
        anchor = ones[0]

    starts = [anchor]
    for number, index, y in candidates:
        if (index, y) <= (anchor[1], anchor[2]):
            continue
        if number == starts[-1][0] + 1:
            starts.append((number, index, y))

    records = []
    for position, (number, page_index, y0) in enumerate(starts):
        if position + 1 < len(starts):
            end_page, end_y = starts[position + 1][1], starts[position + 1][2]
        else:
            end_page, end_y = doc.page_count - 1, doc[doc.page_count - 1].rect.y1

        spans = []
        for index in range(page_index, end_page + 1):
            top = y0 if index == page_index else 0
            bottom = end_y if index == end_page else doc[index].rect.y1
            spans.append((index, top, bottom))

        figures = []
        for index, top, bottom in spans:
            for rect in figure_rects(doc[index], per_page[index]):
                if rect.y0 >= top - 2 and rect.y1 <= bottom + 2:
                    padded = pymupdf.Rect(
                        max(doc[index].rect.x0, rect.x0 - FIGURE_PAD),
                        max(doc[index].rect.y0, rect.y0 - FIGURE_PAD),
                        min(doc[index].rect.x1, rect.x1 + FIGURE_PAD),
                        min(doc[index].rect.y1, rect.y1 + FIGURE_PAD))
                    figures.append({"page": index, "rect": list(padded)})

        body = []
        for index, top, bottom in spans:
            for value, rect in per_page[index]:
                if rect.y0 >= top - 0.5 and rect.y1 <= bottom + 0.5:
                    body.append(value)

        stem_lines, choices, current, in_answers = [], {}, None, False
        for raw in body:
            line = raw.rstrip()
            stripped = line.strip()
            if not stripped or re.fullmatch(r"-\s*\d+\s*-", stripped):
                continue
            if ANSWER_GROUP_RE.match(stripped):
                in_answers = True
                continue
            if not in_answers:
                stem_lines.append(line)
                continue

            match = CHOICE_RE.match(stripped)
            if match:
                current = match.group(1)
                choices[current] = match.group(2).strip()
            elif current:
                choices[current] = (choices[current] + " " + stripped).strip()
            else:
                # The column headers ("A", "B") sit between the heading and
                # the first option and are not part of any choice.
                continue

        # Preserve the program's line structure; join ordinary prose.
        rendered, paragraph = [], []
        for line in stem_lines:
            if looks_like_program(line):
                if paragraph:
                    rendered.append(" ".join(paragraph))
                    paragraph = []
                rendered.append(line)
            else:
                paragraph.append(line.strip())
        if paragraph:
            rendered.append(" ".join(paragraph))

        stem = "\n".join(rendered)
        stem = re.sub(r"^Q\d+\.\s*", "", stem).strip()
        stem = re.sub(r"[ \t]*\|[ \t]*", " ", stem)
        stem = re.sub(r"[ \t]{2,}", " ", stem)

        choices = {letter: re.sub(r"\s*\|\s*", " | ", value).strip()
                   for letter, value in choices.items()}

        records.append({
            "paper": name,
            "number": number,
            "stem": stem,
            "choices": choices,
            "answer": key.get(number),
            "figures": figures,
            "span": [{"page": p, "top": t, "bottom": b} for p, t, b in spans],
        })

    doc.close()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_DIR + name + ".json", "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=1, ensure_ascii=False)

    no_answer = [r["number"] for r in records if not r["answer"]]
    missing = [r["number"] for r in records
               if r["answer"] and r["answer"] not in r["choices"]]
    counts = {}
    for r in records:
        counts[len(r["choices"])] = counts.get(len(r["choices"]), 0) + 1
    print("%-18s questions=%-4d option-counts=%s no-answer=%d key-not-in-options=%d"
          % (name, len(records), dict(sorted(counts.items())), len(no_answer), len(missing)))
    if missing:
        print("   key not among parsed options:", missing[:15])
    return records


if __name__ == "__main__":
    for name in sys.argv[1:]:
        parse(name)
