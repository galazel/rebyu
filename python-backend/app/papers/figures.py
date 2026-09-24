"""Renders each parsed question's figures to PNG and uploads them to S3.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/render_figures.py 2025A_FE-A [--upload]

Without --upload it renders to /app/scripts/fe_papers/rendered/ only, so the
crops can be looked at before anything leaves the machine.

Two kinds of figure are produced, because the database models them
differently:

  * A QUESTION figure -- the diagram, table or program listing the stem
    refers to. All of a question's figures are composited into one image,
    stacked in reading order, because `questions.image_key` holds one key.

  * CHOICE figures -- for the questions whose options are themselves
    pictures (four graphs, four circuit fragments, four stacked fractions).
    These go to `choices.image_key`, one per choice, and are recognised by
    the question having as many unexplained figures as it has empty choices.

Rendered at 3x so that a diagram's smallest label is still legible when the
image is scaled down into the attempt runner's 40-unit-high box.
"""

import io
import json
import os
import re
import sys

import pymupdf

sys.path.insert(0, "/app")

PDF_DIR = os.environ.get("PAPERS_PDF_DIR", "/app/scripts/fe_papers/pdf/")
PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")
RENDER_DIR = os.environ.get("PAPERS_RENDER_DIR", "/app/scripts/fe_papers/rendered/")

ZOOM = 3.0
GAP = 18  # white space between stacked figures in a composite


def _pixmap(doc, figure):
    page = doc[figure["page"]]
    rect = pymupdf.Rect(figure["rect"])
    return page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=rect, alpha=False)


def _stack(pixmaps):
    """Composites several crops into one tall PNG on a white background."""
    from PIL import Image

    images = [Image.open(io.BytesIO(p.tobytes("png"))) for p in pixmaps]
    if len(images) == 1:
        buffer = io.BytesIO()
        images[0].save(buffer, format="PNG")
        return buffer.getvalue()

    width = max(image.width for image in images)
    height = sum(image.height for image in images) + GAP * (len(images) - 1)
    canvas = Image.new("RGB", (width, height), "white")
    y = 0
    for image in images:
        canvas.paste(image, ((width - image.width) // 2, y))
        y += image.height + GAP
    buffer = io.BytesIO()
    canvas.save(buffer, format="PNG")
    return buffer.getvalue()


def _s3():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=os.environ.get("AWS_S3_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_S3_REGION", "auto"),
    ), os.environ["AWS_S3_BUCKET_NAME"]


def split_figures(record):
    """Decides which figures belong to the question and which to its choices.

    A question whose options are pictures has no usable text for them, so the
    signal is: at least two choices came out empty, and the figures at the end
    of the question number at least as many as the choices. Those trailing
    figures are the options, in reading order; anything before them belongs to
    the stem.
    """
    figures = record["figures"]
    letters = [letter for letter in "abcd" if letter in record["choices"]]
    empty = [letter for letter in letters if not record["choices"][letter].strip()]

    if len(empty) >= 2 and len(figures) >= len(letters) >= 2:
        tail = figures[-len(letters):]
        return figures[:-len(letters)], dict(zip(letters, tail))

    # A question whose options are pictures does not always LOOK empty: the
    # labels drawn inside each picture (axis marks, "C=2") extract as text and
    # land in the choice, so emptiness alone misses it. The reliable signal is
    # geometric -- the trailing figures are a grid of near-identical boxes,
    # one per option, which ordinary illustrations never are.
    if len(figures) >= len(letters) >= 2:
        tail = figures[-len(letters):]
        widths = [f["rect"][2] - f["rect"][0] for f in tail]
        heights = [f["rect"][3] - f["rect"][1] for f in tail]
        uniform = (max(widths) - min(widths) <= 0.2 * max(widths)
                   and max(heights) - min(heights) <= 0.2 * max(heights))
        if uniform and min(widths) >= 60 and min(heights) >= 60:
            return figures[:-len(letters)], dict(zip(letters, tail))
    return figures, {}


#: A section banner -- "Answer questions Q66 through Q100 concerning
#: strategy." -- is a ruled box, so it clusters as a figure, and it sits
#: between two questions, so the one before it claims it.
BANNER_RE = re.compile(r"Answer (?:the )?questions? Q\d+ through Q\d+ concerning", re.I)

#: An option letter as the paper prints it beside a picture or in a list.
OPTION_LABEL_RE = re.compile(r"^\(?([a-h])\)$")


def _figure_text(page, rect):
    return page.get_text(clip=pymupdf.Rect(rect)).strip()


def _label_words(page, clip, letters):
    """(letter, rect) of every printed option letter inside `clip`."""
    out = []
    for word in page.get_text("words", clip=clip):
        match = OPTION_LABEL_RE.match(word[4].strip())
        if match and match.group(1) in letters:
            out.append((match.group(1), pymupdf.Rect(word[:4])))
    return out


def _bands(values, tolerance=6.0):
    """Starts of the distinct rows (or columns) a set of coordinates falls in."""
    starts = []
    for value in sorted(values):
        if not starts or value - starts[-1] > tolerance:
            starts.append(value)
    return starts


def _marks_without_labels(page, region, letters):
    """Strokes, images and WORDS in `region`, less the printed option letters.

    Words, not the text lines `_ink_rects` reports: a line runs from its
    first glyph to its last, so "b)" and the "TMP <- A" box beside it come
    back as one line and the letter cannot be left out on its own.
    """
    marks = _ink_rects(page, region, with_text=False)
    for word in page.get_text("words", clip=region):
        match = OPTION_LABEL_RE.match(word[4].strip())
        if match and match.group(1) in letters:
            continue
        rect = pymupdf.Rect(word[:4]) & region
        if not rect.is_empty:
            marks.append(rect)
    return marks


def label_cut(page, region, letters):
    """{letter: rect} of each option picture, cut at its printed letter.

    The paper sets each option's letter at the top-left of its picture, so
    the letters ARE the grid: an option runs from its own letter to the next
    letter along its row, and down to the next row of letters. Unlike a
    whitespace cut this cannot put a) under the letter b), and it needs no
    gutter -- the failure on 2011A Q8, where dashed gridlines left no blank
    band to cut along.

    The letter itself is left OUT of the crop. The attempt runner shuffles
    choices, so a picture captioned "c)" on the button lettered A is a
    contradiction the learner has to resolve on a timed paper.

    None unless every letter appears exactly once.
    """
    search = pymupdf.Rect(region.x0 - 20, region.y0 - 20,
                          region.x1 + 20, region.y1 + 20) & page.rect
    words = _label_words(page, search, letters)
    labels = dict(words)
    if len(words) != len(letters) or set(labels) != set(letters):
        return None

    rows = _bands([rect.y0 for rect in labels.values()])
    columns = _bands([rect.x0 for rect in labels.values()])

    def next_start(starts, value, limit):
        later = [start for start in starts if start > value + 6]
        return (min(later) - 3) if later else limit

    ink = _marks_without_labels(page, search, letters)
    options = {}
    for letter, label in labels.items():
        cell = pymupdf.Rect(
            label.x0 - 3,
            label.y0 - 3,
            next_start(columns, label.x0, search.x1),
            next_start(rows, label.y0, search.y1),
        )
        marks = [mark & cell for mark in ink if not (mark & cell).is_empty]
        marks = [m for m in marks if m.width >= MIN_INK or m.height >= MIN_INK]
        if not marks:
            return None
        bounds = marks[0]
        for mark in marks[1:]:
            bounds = bounds | mark
        options[letter] = pymupdf.Rect(bounds.x0 - 2, bounds.y0 - 2,
                                       bounds.x1 + 2, bounds.y1 + 2)
    return options


#: What is left of a stem figure once its answer rows are cut away, below
#: which there is nothing of it to show.
MIN_STEM_HEIGHT = 12


def _stem_regions(doc, stem_figures, letters, options_top=None):
    """The stem's figures as one crop per page, answer lists cut away.

    One crop of the whole region, not each figure stacked under the last:
    a diagram the clustering split in two -- a LAN whose server and printer
    are separate clusters -- comes back from a vertical stack as a column of
    boxes that is not the diagram at all (2011A Q27). The page's own layout
    is the diagram.

    `options_top` is where picture options begin on that page, when they
    do: the stem ends above them.
    """
    by_page = {}
    for figure in stem_figures:
        by_page.setdefault(figure["page"], []).append(pymupdf.Rect(figure["rect"]))

    out = []
    for page_index, rects in by_page.items():  # reading order, as parsed
        page = doc[page_index]
        region = rects[0]
        for rect in rects[1:]:
            region = region | rect

        top = None
        # Looked for a little outside the figure too: a cluster often ends
        # partway through the answer rows or just right of the letters, and
        # with only one letter inside it the list was not recognised
        # (2010S Q42 kept "a) A->C->E->G  b) A->D->H" under its network).
        around = pymupdf.Rect(region.x0 - 25, region.y0, region.x1, region.y1 + 40) & page.rect
        labels = [label for _, label in _label_words(page, around, letters)
                  if label.y0 < region.y1]
        if len(labels) >= 2:
            top = min(label.y0 for label in labels)
        if options_top and options_top.get(page_index) is not None:
            bound = options_top[page_index]
            top = bound if top is None else min(top, bound)
        if top is not None and region.y0 < top < region.y1:
            # Above the first lettered answer. An answer TABLE keeps its
            # header row this way, and should: the choices are its rows
            # joined with "|", and the header is what says which column is
            # which ("Source (From) | Destination (To)").
            region = pymupdf.Rect(region.x0, region.y0, region.x1, top - 3)
        elif top is not None and top <= region.y0:
            continue

        ink = _ink_rects(page, region)
        if not ink:
            continue
        bounds = ink[0]
        for mark in ink[1:]:
            bounds = bounds | mark
        # Nothing of substance left: it was only ever the answer list.
        if bounds.height < MIN_STEM_HEIGHT:
            continue
        out.append({"page": page_index, "rect": list(region)})
    return out


def _overlap(first, second):
    """Whether two figure rects share more than a hairline of paper."""
    a, b = first["rect"], second["rect"]
    if first["page"] != second["page"]:
        return False
    width = min(a[2], b[2]) - max(a[0], b[0])
    height = min(a[3], b[3]) - max(a[1], b[1])
    return width > 5 and height > 5


def split_figures_on_page(doc, record):
    """`split_figures`, corrected against the page itself.

    Faults the rect arithmetic cannot see, all found on imported items:

    * a section banner stored as the preceding question's figure;
    * the paper's printed answer list inside a stem figure -- which the
      runner's shuffled buttons then contradict;
    * a stem diagram split into clusters and re-stacked as a column;
    * option pictures cut from stroke clusters that each straddle two
      diagrams of a 2x2 grid -- similar in size, so `split_figures` accepted
      them, and every option image showed halves of two graphs. 22 of the
      first 35 picture-option questions were cut this way.

    Option pictures are cut at their printed letters (`label_cut`), then by
    whitespace (`xy_cut`) where the letters cannot be found. If neither
    divides the grid the options are dropped and the grid stays whole with
    the stem: one honest composite rather than crops that answer the wrong
    question.
    """
    letters = [letter for letter in "abcdefgh" if letter in record.get("choices", {})]
    figures = [
        f for f in record.get("figures") or []
        if not BANNER_RE.search(_figure_text(doc[f["page"]], f["rect"]))
    ]
    stem_figures, choice_figures = split_figures({**record, "figures": figures})
    if not choice_figures:
        return _stem_regions(doc, stem_figures, letters), {}

    options = list(choice_figures.values())
    page_index = options[0]["page"]
    if any(f["page"] != page_index for f in options):
        return _stem_regions(doc, figures, []), {}
    region = pymupdf.Rect(options[0]["rect"])
    for figure in options[1:]:
        region = region | pymupdf.Rect(figure["rect"])
    page = doc[page_index]

    cut = label_cut(page, region, list(choice_figures))
    if cut is None:
        parts = xy_cut(page, region, len(options))
        if not parts:
            return _stem_regions(doc, figures, []), {}
        cut = dict(zip(choice_figures, parts))

    labels = _label_words(page, pymupdf.Rect(region.x0 - 20, region.y0 - 20,
                                             region.x1 + 20, region.y1 + 20),
                          list(choice_figures))
    tops = [label.y0 for _, label in labels] + [rect.y0 for rect in cut.values()]
    stem = _stem_regions(doc, stem_figures, [], {page_index: min(tops)})
    return stem, {
        letter: {"page": page_index, "rect": list(rect)} for letter, rect in cut.items()
    }


#: Zoom for the page image the vision agent reads. Lower than the 3x used for
#: stored figures: the agent is judging layout -- how many separate pictures
#: are there, do they line up with the choices -- not reading fine labels, and
#: every pixel is tokens.
AGENT_ZOOM = 2.0

#: Margin around the question's figures in the image the agent sees, in points.
#: Wide enough to include the lettered choices printed beside or beneath them,
#: which is the evidence for "one picture per option".
AGENT_MARGIN = 40


def question_region_png(doc, record):
    """The question's own patch of the page, as PNG bytes, or None.

    Its OWN patch, not the whole page: a full page shows the neighbouring
    questions too, and "does this figure belong to this question" is precisely
    what the agent is being asked. Showing it the neighbours is handing it the
    ambiguity instead of resolving it.
    """
    figures = record.get("figures") or []
    if not figures:
        return None

    page_index = figures[0]["page"]
    same_page = [f for f in figures if f["page"] == page_index]
    region = pymupdf.Rect(same_page[0]["rect"])
    for figure in same_page[1:]:
        region = region | pymupdf.Rect(figure["rect"])

    page = doc[page_index]
    region = pymupdf.Rect(
        region.x0 - AGENT_MARGIN, region.y0 - AGENT_MARGIN,
        region.x1 + AGENT_MARGIN, region.y1 + AGENT_MARGIN,
    ) & page.rect
    if region.is_empty:
        return None

    return page.get_pixmap(
        matrix=pymupdf.Matrix(AGENT_ZOOM, AGENT_ZOOM), clip=region, alpha=False
    ).tobytes("png")


#: The narrowest band of blank paper that counts as a boundary between two
#: option pictures, in points. Below this it is the gap between two nodes of
#: one diagram, not the gutter between two diagrams.
MIN_CUT_GAP = 9.0

#: Ink thinner than this in both dimensions is a stray mark -- an axis tick, a
#: stray underscore -- and letting it bridge a gutter merges two options.
MIN_INK = 1.5


def _ink_rects(page, region, with_text=True):
    """What leaves a mark inside `region`: strokes, images, and optionally text.

    `with_text=False` is what the CUTS use, and the distinction matters more
    than it looks. A reported text line spans from the first glyph on a
    baseline to the last -- and when two option diagrams sit side by side,
    their labels share baselines, so one "line" reaches across the gutter
    between them. Projected onto the x axis that line fills the gap
    completely: measured with text, the widest gutter between two options
    here is 0.0pt; measured without it, 19pt and 47pt.

    Text is still included when TIGHTENING a part, because by then the
    boundary is fixed and the only question is whether a label falls inside
    it.
    """
    from app.papers.subject_a import page_lines

    marks = [pymupdf.Rect(d["rect"]) for d in page.get_drawings()]
    for info in page.get_images(full=True):
        marks.extend(page.get_image_rects(info[0]))
    if with_text:
        marks.extend(rect for _, rect in page_lines(page))

    inside = []
    for mark in marks:
        clipped = mark & region
        if clipped.is_empty:
            continue
        if clipped.width < MIN_INK and clipped.height < MIN_INK:
            continue
        inside.append(clipped)
    return inside


def _widest_gap(spans):
    """(size, position) of the widest blank run between spans, or (0, 0).

    Spans are merged first: two overlapping diagrams contribute one occupied
    run, and the gutter is the blank between runs.
    """
    if len(spans) < 2:
        return 0.0, 0.0
    spans = sorted(spans)
    merged = [list(spans[0])]
    for low, high in spans[1:]:
        if low <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], high)
        else:
            merged.append([low, high])

    best = (0.0, 0.0)
    for left, right in zip(merged, merged[1:]):
        gap = right[0] - left[1]
        if gap > best[0]:
            best = (gap, (left[1] + right[0]) / 2)
    return best


def _tighten(page, part):
    """A sub-region shrunk to the ink actually in it, plus a hair of margin."""
    ink = _ink_rects(page, part)
    if not ink:
        return None
    bounds = ink[0]
    for mark in ink[1:]:
        bounds = bounds | mark
    # A wider left margin than the others: the option's own letter ("a)",
    # "b)") is set to the left of its diagram, outside the ink the cut was
    # measured from, and a symmetric 2pt margin clips it to a bare ")".
    return pymupdf.Rect(
        bounds.x0 - 14, bounds.y0 - 2, bounds.x1 + 2, bounds.y1 + 2
    ) & part


def _best_cut(page, region):
    """(axis, position) of the widest gutter through `region`, or None."""
    ink = _ink_rects(page, region, with_text=False)
    if len(ink) < 2:
        return None
    best = None
    for axis, spans in (
        ("x", [(r.x0, r.x1) for r in ink]),
        ("y", [(r.y0, r.y1) for r in ink]),
    ):
        gap, cut = _widest_gap(spans)
        if gap >= MIN_CUT_GAP and (best is None or gap > best[0]):
            best = (gap, axis, cut)
    if best is None:
        return None
    gap, axis, cut = best
    return axis, _clear_of_text(page, region, axis, cut - gap / 2, cut + gap / 2, cut)


def _clear_of_text(page, region, axis, low, high, cut):
    """Where inside the gutter [low, high] to cut so no label is sliced.

    The gutter is measured without text (see `_ink_rects`), and its middle is
    often exactly where the next option's letter sits: a) above its graph,
    c) above the one below, the cut through "c)". The middle of the widest
    text-free run INSIDE the gutter is used instead, and the plain middle
    only when text fills the gutter wall to wall.
    """
    from app.papers.subject_a import page_lines

    spans = []
    for _, rect in page_lines(page):
        clipped = rect & region
        if clipped.is_empty:
            continue
        span = (clipped.x0, clipped.x1) if axis == "x" else (clipped.y0, clipped.y1)
        if span[1] > low and span[0] < high:
            spans.append((max(span[0], low), min(span[1], high)))
    if not spans:
        return cut
    gap, position = _widest_gap([(low, low)] + spans + [(high, high)])
    return position if gap > 0 else cut


def _halves(region, axis, cut):
    if axis == "x":
        return (pymupdf.Rect(region.x0, region.y0, cut, region.y1),
                pymupdf.Rect(cut, region.y0, region.x1, region.y1))
    return (pymupdf.Rect(region.x0, region.y0, region.x1, cut),
            pymupdf.Rect(region.x0, cut, region.x1, region.y1))


def _split_into(page, region, count):
    """`region` divided into exactly `count` parts by recursive bisection.

    Bisection, not "repeatedly cut wherever the gap is widest". Greedy global
    cutting looks right and is not: on a 2x2 grid of option diagrams the two
    gutters are never equally wide, so after the first horizontal cut the
    greedy rule spends its remaining cuts subdividing whichever row had the
    wider vertical gutter -- and returns one whole row plus three slices of
    the other. Splitting the count down the recursion keeps the two halves
    balanced, which is what a grid of options actually is.
    """
    if count <= 1:
        return [region]
    cut = _best_cut(page, region)
    if cut is None:
        return None
    left, right = _halves(region, *cut)
    first = _split_into(page, left, count // 2)
    second = _split_into(page, right, count - count // 2)
    if first is None or second is None:
        return None
    return first + second


def xy_cut(page, region, count):
    """Split `region` into exactly `count` pictures, or None if it does not.

    An XY-cut: slice on the bands of blank paper running through the region.
    It is the right tool here because option pictures on an exam paper are
    laid out on a grid with real gutters between them -- in a row, a column,
    or two by two -- and a gutter is exactly what this finds.

    `_cluster` in subject_a cannot do this job: it merges strokes within 14pt
    of one another, and the nodes of two ADJACENT option diagrams are
    routinely closer than that, so four options come back as one region. This
    works from the whitespace instead, which separates the options even where
    their ink nearly touches.

    Returns None rather than a best effort when the region will not divide
    cleanly, so the caller keeps the composite instead of cropping at a
    guessed boundary.
    """
    parts = _split_into(page, region, count)
    if not parts or len(parts) != count:
        return None

    tightened = [_tighten(page, part) for part in parts]
    if any(part is None or part.is_empty for part in tightened):
        return None

    # Reading order: top row left-to-right, then the next row. Banded by the
    # median height so a picture sitting slightly low is not read as its own
    # row -- which would letter a 2x2 grid a, c, b, d.
    band = sorted(part.height for part in tightened)[len(tightened) // 2] or 1
    return sorted(tightened, key=lambda r: (round(r.y0 / band), r.x0))


async def split_figures_assisted(doc, record):
    """`split_figures`, with the vision agent consulted where it is unsure.

    Returns `(stem_figures, {letter: figure}, verdict)`.

    The geometry is tried first and kept whenever it is confident, so the
    agent is not called for the questions that were never in doubt -- which
    is most of them. It is called when there are several figures and several
    choices and the uniformity test said "not options", because that is
    exactly the shape of the failure: four option pictures drawn at slightly
    different sizes, rejected and glued into one image.
    """
    from app.papers.figure_agent import FigureVerdict, read_question_figures

    stem_figures, choice_figures = split_figures_on_page(doc, record)
    if choice_figures:
        return stem_figures, choice_figures, FigureVerdict.unknown()

    figures = record.get("figures") or []
    letters = [letter for letter in "abcdefgh" if letter in record.get("choices", {})]
    if len(figures) < 2 or len(letters) < 2:
        return stem_figures, choice_figures, FigureVerdict.unknown()

    image = question_region_png(doc, record)
    verdict = await read_question_figures(
        image, record.get("question", "") or record.get("text", ""), len(letters)
    )
    if not verdict.confident or not verdict.figures_are_choices:
        return stem_figures, choice_figures, verdict

    # The agent says these are the options. The TRAILING `choice_count`
    # figures are taken, in reading order, which is the same assignment the
    # geometric path makes -- the agent settled whether they are options, not
    # which picture belongs to which letter, because it was never shown the
    # letters in a form it could map.
    count = min(verdict.choice_count, len(letters))
    if count < 2:
        return stem_figures, choice_figures, verdict

    # The agent settled WHAT these pictures are. It is not asked where they
    # are: the stored figure rects are clusters of nearby strokes, and on a
    # grid of option diagrams those clusters routinely straddle two options
    # -- so slicing the trailing `count` of them apart yields fragments of
    # two diagrams each, which is worse than the single composite it replaces.
    #
    # The region is re-cut from the whitespace instead, which is what
    # actually separates one option from the next.
    page_index = figures[0]["page"]
    on_page = [f for f in figures if f["page"] == page_index]
    region = pymupdf.Rect(on_page[0]["rect"])
    for figure in on_page[1:]:
        region = region | pymupdf.Rect(figure["rect"])

    # The printed letters first -- they say which picture is which -- and
    # the whitespace only where they cannot be found.
    labelled = label_cut(doc[page_index], region, letters[:count])
    if labelled:
        parts = [labelled[letter] for letter in letters[:count]]
    else:
        parts = xy_cut(doc[page_index], region, count)
    if not parts:
        # It would not divide cleanly. Keeping the composite is honest; four
        # crops at guessed boundaries are not.
        return stem_figures, choice_figures, verdict

    options = {
        letter: {"page": page_index, "rect": list(part)}
        for letter, part in zip(letters[:count], parts)
    }
    # Every figure on this page became an option, so the stem keeps only what
    # was on any other page -- normally nothing.
    remaining = [f for f in figures if f["page"] != page_index]
    return remaining, options, verdict


async def run_assisted(name, upload, use_agent=True):
    """`run`, with the vision agent consulted on the questions geometry is
    unsure about.

    This is what the LIVE IMPORT calls, so a paper uploaded through the admin
    screen gets the same treatment as one repaired by
    `scripts/fe_papers/recover_choice_images.py`. Keeping the agent in the
    repair script alone would have meant every NEW upload re-created the
    defect the repair script exists to undo.

    `use_agent=False` falls back to the pure-geometry path, and so does an
    agent that is unreachable -- see `figure_agent.FigureVerdict.unknown`. An
    import must not depend on an AI provider being up or funded.
    """
    with open(PARSED_DIR + name + ".json", encoding="utf-8") as handle:
        records = json.load(handle)

    doc = pymupdf.open(PDF_DIR + name + "_Questions.pdf")
    os.makedirs(RENDER_DIR + name, exist_ok=True)
    client = bucket = None
    if upload:
        client, bucket = _s3()

    question_images = choice_images = agent_recovered = 0
    for record in records:
        if use_agent:
            stem_figures, choice_figures, _ = await split_figures_assisted(doc, record)
            if choice_figures and not split_figures(record)[1]:
                agent_recovered += 1
        else:
            stem_figures, choice_figures = split_figures_on_page(doc, record)
        record["choice_images"] = {}

        if stem_figures:
            data = _stack([_pixmap(doc, f) for f in stem_figures])
            filename = "q%02d.png" % record["number"]
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["image_key"] = key
            question_images += 1
        else:
            record["image_key"] = None

        for letter, figure in choice_figures.items():
            data = _stack([_pixmap(doc, figure)])
            filename = "q%02d%s.png" % (record["number"], letter)
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["choice_images"][letter] = key
            choice_images += 1

    doc.close()
    with open(PARSED_DIR + name + ".json", "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=1, ensure_ascii=False)

    print("%-18s question images=%-4d choice images=%-4d (agent found %d) %s"
          % (name, question_images, choice_images, agent_recovered,
             "uploaded" if upload else "(local only)"))


def run(name, upload):
    with open(PARSED_DIR + name + ".json", encoding="utf-8") as handle:
        records = json.load(handle)

    doc = pymupdf.open(PDF_DIR + name + "_Questions.pdf")
    os.makedirs(RENDER_DIR + name, exist_ok=True)
    client = bucket = None
    if upload:
        client, bucket = _s3()

    question_images = choice_images = 0
    for record in records:
        stem_figures, choice_figures = split_figures_on_page(doc, record)
        record["choice_images"] = {}

        if stem_figures:
            data = _stack([_pixmap(doc, f) for f in stem_figures])
            filename = "q%02d.png" % record["number"]
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["image_key"] = key
            question_images += 1
        else:
            record["image_key"] = None

        for letter, figure in choice_figures.items():
            data = _stack([_pixmap(doc, figure)])
            filename = "q%02d%s.png" % (record["number"], letter)
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["choice_images"][letter] = key
            choice_images += 1

    doc.close()
    with open(PARSED_DIR + name + ".json", "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=1, ensure_ascii=False)

    print("%-18s question images=%-4d choice images=%-4d %s"
          % (name, question_images, choice_images,
             "uploaded" if upload else "(local only)"))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name in args:
        run(name, "--upload" in sys.argv)
