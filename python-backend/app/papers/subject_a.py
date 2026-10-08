"""Parses an ITPEC FE Subject A / Morning paper into structured questions.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/parse_subject_a.py 2025A_FE-A

Reads <name>_Questions.pdf and its answer key, and writes <name>.json holding
one record per question: stem, four choices, the correct letter, and the page
and rectangle any figure occupies.

The text layer of these papers is clean enough to parse, with two exceptions
that the extraction has to handle rather than ignore:

  * Mathematical layout is lost. A fraction typeset as a numerator above a
    denominator extracts as two separate lines, so "1/168" arrives as "1"
    on one line and "168" several lines later. Any question whose choices
    look like this is flagged `needs_figure`, and the rendered crop -- not
    the text -- becomes the authoritative form of the choices.

  * Figures are vector drawings, not embedded images, so `get_images()`
    finds almost nothing. The figure has to be located geometrically, as
    the region of the page covered by drawing operations inside the
    question's own vertical span.

Nothing here writes to the database; seeding is a separate step.
"""

import json
import os
import re
import sys

import pymupdf

PDF_DIR = os.environ.get("PAPERS_PDF_DIR", "/app/scripts/fe_papers/pdf/")
OUT_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")

MIN_FIGURE_WIDTH = 40
MIN_FIGURE_HEIGHT = 18

FIGURE_PAD = 6

CHOICE_RE = re.compile(r"^\s*([a-h])\)\s*(.*)$")
QUESTION_RE = re.compile(r"^\s*Q(\d+)\.\s*(.*)$")

INLINE_CHOICE_RE = re.compile(r"(?:(?<=\s)|^)([a-h])\)(?=\s|$)")

LOOSE_CHOICE_RE = re.compile(r"(?:(?<=\s)|^)([a-h])(?=\s)")


def answer_key(path):
    """Answer keys are a two-column 'number, letter' table read top to bottom.

    The numbers and letters extract as alternating lines once the header is
    past, so the parse pairs them positionally rather than by regex over a
    line that never contains both.
    """
    doc = pymupdf.open(path)
    tokens = [t.strip() for t in doc[0].get_text().splitlines() if t.strip()]
    doc.close()

    answers = {}
    pending = None
    for token in tokens:
        if re.fullmatch(r"\d{1,3}", token):
            pending = int(token)
        elif re.fullmatch(r"[a-h]", token) and pending is not None:
            answers[pending] = token
            pending = None
    return answers


ROW_TOLERANCE = 5

COLUMN_GAP = 24


def page_lines(page):
    """Text lines grouped into visual rows, each row read left to right."""
    raw = []
    data = page.get_text("dict")
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                raw.append((text, pymupdf.Rect(line["bbox"])))

    raw.sort(key=lambda item: ((item[1].y0 + item[1].y1) / 2, item[1].x0))

    rows = []
    for text, rect in raw:
        centre = (rect.y0 + rect.y1) / 2
        if rows and abs(rows[-1][0] - centre) <= ROW_TOLERANCE:
            rows[-1][1].append((text, rect))
        else:
            rows.append((centre, [(text, rect)]))

    out = []
    for _, members in rows:
        members.sort(key=lambda item: item[1].x0)
        previous = None
        for text, rect in members:
            if previous is not None and rect.x0 - previous > COLUMN_GAP:
                out.append(("|", pymupdf.Rect(previous, rect.y0, rect.x0, rect.y1)))
            out.append((text, rect))
            previous = rect.x1
    return out


def _cluster(rects, gap=14):
    """Merges rects that touch or nearly touch into connected groups.

    Necessary because a figure is not one drawing operation but hundreds of
    strokes, and a table is a mesh of lines each of which is thinner than any
    sensible size threshold. Filtering strokes individually finds neither;
    clustering first and filtering the cluster finds both.
    """
    groups = []
    for rect in rects:
        grown = pymupdf.Rect(rect.x0 - gap, rect.y0 - gap,
                             rect.x1 + gap, rect.y1 + gap)
        merged = [rect]
        remaining = []
        for group in groups:
            if grown.intersects(group):
                merged.append(group)
            else:
                remaining.append(group)
        union = merged[0]
        for item in merged[1:]:
            union |= item
        remaining.append(union)
        groups = remaining

    changed = True
    while changed:
        changed = False
        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                grown = pymupdf.Rect(groups[i].x0 - gap, groups[i].y0 - gap,
                                     groups[i].x1 + gap, groups[i].y1 + gap)
                if grown.intersects(groups[j]):
                    groups[i] |= groups[j]
                    del groups[j]
                    changed = True
                    break
            if changed:
                break
    return groups


LABEL_REACH = 16


def figure_rects(page, lines=None):
    """Regions of the page occupied by a diagram, table or embedded image."""
    strokes = [pymupdf.Rect(d["rect"]) for d in page.get_drawings()]
    for info in page.get_images(full=True):
        strokes.extend(page.get_image_rects(info[0]))
    strokes = [r for r in strokes if r.width > 0 and r.height > 0]
    groups = [g for g in _cluster(strokes)
              if g.width >= MIN_FIGURE_WIDTH and g.height >= MIN_FIGURE_HEIGHT]
    if not groups:
        return groups

    if lines is None:
        lines = page_lines(page)

    for index, group in enumerate(groups):
        limit = pymupdf.Rect(group.x0 - 2 * LABEL_REACH,
                             group.y0 - 2 * LABEL_REACH,
                             group.x1 + 2 * LABEL_REACH,
                             group.y1 + 2 * LABEL_REACH)
        changed = True
        while changed:
            changed = False
            reach = pymupdf.Rect(group.x0 - LABEL_REACH, group.y0 - LABEL_REACH,
                                 group.x1 + LABEL_REACH, group.y1 + LABEL_REACH)
            for _, rect in lines:
                if rect in group or not reach.intersects(rect):
                    continue
                grown = group | rect
                if grown in limit:
                    group = grown
                    changed = True
            groups[index] = group

    return [_whole_lines_only(group, lines) for group in groups]


LINE_KEEP_SHARE = 0.5

LINE_INK_SLACK = 3.0


def _whole_lines_only(group, lines):
    """Moves a crop edge off any text line it would cut through.

    The growth loop above absorbs a caption only when the whole line fits
    inside the cap. A line that does not fit is left where it is -- and the
    crop boundary then lands wherever the cap put it, which is routinely in
    the middle of the row of text just above or below the figure. The result
    is a scan with a band of half-glyphs along one edge: the reader sees the
    bottom halves of letters and cannot tell whether they were part of the
    diagram.

    So every line the crop merely OVERLAPS is resolved one way or the other.
    Mostly inside, it is taken in whole; mostly outside, the edge retreats to
    clear it. Either way the crop never bisects a line, and it can only move
    by the height of one line, so a table cannot ratchet out over the stem.
    """
    probe = pymupdf.Rect(group.x0, group.y0 - LINE_INK_SLACK,
                         group.x1, group.y1 + LINE_INK_SLACK)
    for _, rect in lines:
        if rect in group or not probe.intersects(rect):
            continue
        overlap = min(group.y1, rect.y1) - max(group.y0, rect.y0)
        if rect.height > 0 and overlap / rect.height >= LINE_KEEP_SHARE:
            if rect.y0 < group.y0:
                group.y0 = rect.y0 - LINE_INK_SLACK
            if rect.y1 > group.y1:
                group.y1 = rect.y1 + LINE_INK_SLACK
            group.x0 = min(group.x0, rect.x0)
            group.x1 = max(group.x1, rect.x1)
        elif rect.y1 <= group.y1 and rect.y1 - group.y0 > -LINE_INK_SLACK:
            group.y0 = rect.y1 + LINE_INK_SLACK
        elif rect.y0 >= group.y0 and group.y1 - rect.y0 > -LINE_INK_SLACK:
            group.y1 = rect.y0 - LINE_INK_SLACK
    return group


def parse(name):
    questions_pdf = PDF_DIR + name + "_Questions.pdf"
    answers_pdf = None
    for suffix in ("_Answers.pdf", "_Answer.pdf"):
        candidate = PDF_DIR + name + suffix
        if os.path.exists(candidate):
            answers_pdf = candidate
            break
    if answers_pdf is None:
        raise SystemExit("no answer key found for " + name)

    key = answer_key(answers_pdf)
    doc = pymupdf.open(questions_pdf)

    candidates = []
    per_page = {}
    for index in range(doc.page_count):
        lines = page_lines(doc[index])
        per_page[index] = lines
        for text, rect in lines:
            match = QUESTION_RE.match(text)
            if match:
                candidates.append((int(match.group(1)), index, rect.y0))

    first_q2 = next((c for c in candidates if c[0] == 2), None)
    q1s = [c for c in candidates if c[0] == 1]
    if first_q2 is not None:
        before = [c for c in q1s
                  if (c[1], c[2]) < (first_q2[1], first_q2[2])]
        anchor = before[-1] if before else q1s[0]
    else:
        anchor = q1s[0]

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
            inside = [r for r in figure_rects(doc[index], per_page[index])
                      if r.y0 >= top - 2 and r.y1 <= bottom + 2]
            for rect in inside:
                padded = pymupdf.Rect(
                    max(doc[index].rect.x0, rect.x0 - FIGURE_PAD),
                    max(doc[index].rect.y0, rect.y0 - FIGURE_PAD),
                    min(doc[index].rect.x1, rect.x1 + FIGURE_PAD),
                    min(doc[index].rect.y1, rect.y1 + FIGURE_PAD))
                figures.append({"page": index, "rect": list(padded)})

        figure_by_page = {}
        for figure in figures:
            figure_by_page.setdefault(figure["page"], []).append(
                pymupdf.Rect(figure["rect"]))

        body = []
        seen_choice = False
        for index, top, bottom in spans:
            covers = figure_by_page.get(index, [])
            for text, rect in per_page[index]:
                if not (rect.y0 >= top - 0.5 and rect.y1 <= bottom + 0.5):
                    continue
                if not seen_choice and INLINE_CHOICE_RE.search(text.strip()):
                    seen_choice = True
                elif not seen_choice:
                    centre = pymupdf.Point((rect.x0 + rect.x1) / 2,
                                           (rect.y0 + rect.y1) / 2)
                    if any(centre in cover for cover in covers):
                        continue
                body.append(text)

        stem_lines, choices, current = [], {}, None
        expected = "a"
        for raw in body:
            line = raw.strip()
            if not line or line.startswith("–") or re.fullmatch(r"-\s*\d+\s*-", line):
                continue
            if re.fullmatch(r"\s*-?\s*\d+\s*-?\s*", line) and len(line) < 6:
                continue

            pieces, cursor = [], 0
            while True:
                match = None
                for candidate in INLINE_CHOICE_RE.finditer(line, cursor):
                    if candidate.group(1) == expected:
                        match = candidate
                        break
                if match is None and choices:
                    for candidate in LOOSE_CHOICE_RE.finditer(line, cursor):
                        if candidate.group(1) == expected:
                            match = candidate
                            break
                if match is None:
                    break
                if match.start() > cursor:
                    pieces.append((None, line[cursor:match.start()]))
                pieces.append((expected, None))
                cursor = match.end()
                expected = chr(ord(expected) + 1)
            if cursor < len(line):
                pieces.append((None, line[cursor:]))

            for letter, text in pieces:
                if letter is not None:
                    current = letter
                    choices.setdefault(current, "")
                    continue
                text = text.strip()
                if not text:
                    continue
                if current:
                    choices[current] = (choices[current] + " " + text).strip()
                else:
                    stem_lines.append(text)

        def tidy(value):
            """Removes the column markers where they carry no information.

            The pipe is inserted between fragments separated by a wide gap,
            which is right for a combination choice ("analog | digital") and
            noise everywhere else -- a lone label beside a diagram, or the
            empty cells of a choice that is really a picture.
            """
            value = re.sub(r"^Q\d+\.\s*", "", value)
            value = re.sub(r"\s*Answer (?:the )?questions? Q\d+ through Q\d+ "
                           r"concerning [\w ]+\.?\s*$", "", value, flags=re.I)
            value = re.sub(r"\s*\|\s*", " | ", value)
            value = re.sub(r"(?:\|\s*)+\|", "|", value)
            value = re.sub(r"^\s*\|\s*|\s*\|\s*$", "", value)
            return re.sub(r"\s+", " ", value).strip()

        stem = tidy(" ".join(stem_lines))
        choices = {letter: tidy(value) for letter, value in choices.items()}

        records.append({
            "paper": name,
            "number": number,
            "stem": stem,
            "choices": {letter: choices.get(letter, "") for letter in "abcd"
                        if letter in choices},
            "answer": key.get(number),
            "figures": figures,
            "span": [{"page": p, "top": t, "bottom": b} for p, t, b in spans],
        })

    doc.close()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_DIR + name + ".json", "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=1, ensure_ascii=False)

    missing_answer = [r["number"] for r in records if not r["answer"]]
    bad_choices = [r["number"] for r in records if len(r["choices"]) != 4]
    empty_choice = [r["number"] for r in records
                    if any(not v.strip() for v in r["choices"].values())]
    with_figure = [r["number"] for r in records if r["figures"]]

    print("%-18s questions=%-4d figures=%-4d no-answer=%-3d not-4-choices=%-3d empty-choice=%d"
          % (name, len(records), len(with_figure), len(missing_answer),
             len(bad_choices), len(empty_choice)))
    if missing_answer:
        print("   no answer:", missing_answer[:20])
    if bad_choices:
        print("   not 4 choices:", bad_choices[:20])
    if empty_choice:
        print("   empty choice text:", empty_choice[:20])
    return records


if __name__ == "__main__":
    for name in sys.argv[1:]:
        parse(name)
