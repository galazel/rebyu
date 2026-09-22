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

#: Drawings smaller than this in either dimension are page furniture -- rule
#: lines under headers, underscores marking a blank, the box around a letter.
MIN_FIGURE_WIDTH = 40
MIN_FIGURE_HEIGHT = 18

#: A question's figure region is padded by this much so that a diagram's
#: outermost stroke and its labels are not clipped.
FIGURE_PAD = 6

CHOICE_RE = re.compile(r"^\s*([a-h])\)\s*(.*)$")
QUESTION_RE = re.compile(r"^\s*Q(\d+)\.\s*(.*)$")

#: Finds a choice marker anywhere in a line, not only at its start. Choices
#: laid out side by side across the page arrive as one joined row --
#: "a) 20.1  b) 25.725  c) 30.725  d) 74.1" -- and matching only at the start
#: would fold three of the four into the first choice's text.
INLINE_CHOICE_RE = re.compile(r"(?:(?<=\s)|^)([a-h])\)(?=\s|$)")

#: The same marker with its bracket missing. A handful of choices across these
#: papers extract as a bare "c" where the page shows "c)", so requiring the
#: bracket loses that choice AND every choice after it, because the sequence
#: never reaches the next expected letter. Accepted only when the letter is
#: exactly the one expected next and at least one choice has already been
#: seen, which is narrow enough not to fire on ordinary prose.
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


#: Two text lines whose vertical centres are within this many points belong to
#: the same visual row. It matters more than it sounds: a choice marker "a)"
#: and the choice text beside it are separate blocks whose baselines differ by
#: about a point, and often the TEXT sits marginally higher than its own
#: marker. Sorted by raw y, every choice on such a page is shifted by one --
#: the first choice's text is absorbed into the stem and the last marker ends
#: up empty, silently producing four wrong answers.
ROW_TOLERANCE = 5

#: A horizontal gap this wide between two fragments of the same row means they
#: are separate columns rather than continuing text.
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

    # Fragments on the same row that are separated by a wide horizontal gap
    # are columns of a table, not a sentence split in two. "Combination"
    # questions -- pick the row that fills blanks A, B and C -- are laid out
    # exactly this way and often unruled, so without a separator their choices
    # read as "analog digital analog" and the column each value belongs to is
    # lost. Joining with a pipe keeps that structure in plain text.
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

    # One pass is not always enough: two clusters can become adjacent only
    # after a third merges into one of them.
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


#: How far above or beside a figure a text line may sit and still be part of
#: it. A diagram's labels and a table's caption are ordinary text that no
#: drawing operation covers, so a crop bounded by the strokes alone slices the
#: top off every self-loop label and every "Table 1" caption.
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

    # Grow each group over the text that belongs to it, repeating until it
    # stops growing: a caption pulled in on one pass can bring a second line
    # of the same caption within reach on the next.
    for index, group in enumerate(groups):
        # The cap is measured against the ORIGINAL cluster and never moves.
        # Re-measuring it each pass lets the region ratchet outward in steps
        # that are each individually small, and a table whose rules span the
        # text column then swallows the stem above it -- leaving the question
        # with no text at all and the whole page inside its "figure".
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
    return groups


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

    # Pass one: find where every question starts. A question may begin on one
    # page and run onto the next, so spans are recorded as (page, y) pairs and
    # resolved afterwards.
    candidates = []
    per_page = {}
    for index in range(doc.page_count):
        lines = page_lines(doc[index])
        per_page[index] = lines
        for text, rect in lines:
            match = QUESTION_RE.match(text)
            if match:
                candidates.append((int(match.group(1)), index, rect.y0))

    # Every paper prints a worked SAMPLE question in its instructions, and it
    # is numbered "Q1." as well. Taking the first Q1 therefore imports the
    # sample -- with the real Q1's answer letter attached to it, which is
    # worse than importing nothing. The real Q1 is the last one printed before
    # the first Q2, so the sequence is anchored there and walked forward.
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

        # Figures first: their labels are text too, and must be kept out of
        # the stem. A state diagram contributes "S1 S2 0/0 1/1" in an order
        # governed by drawing, not by reading, and pasted into the stem it is
        # indistinguishable from the question's own words.
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

        # Collect the question's lines across every page it spans.
        #
        # Figure-internal text is dropped only until the first choice marker.
        # Past that point the clustering is no longer trustworthy as a filter:
        # a choice list laid out as a grid is itself a mesh of ruled lines, so
        # it clusters into a "figure" and dropping its text would silently
        # discard the answers. Before the first marker the same rule is what
        # keeps a state diagram's labels out of the stem.
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

            # Split a row carrying several markers into its parts, accepting a
            # marker only when it is the next letter in sequence -- "a)" inside
            # a choice's own prose ("options a) and b) differ") must not start
            # a new choice.
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
