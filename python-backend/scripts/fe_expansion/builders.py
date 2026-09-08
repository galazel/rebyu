"""Block, lesson and question builders for the FE Exam curriculum.

`lessons.lesson_component_structure` is a JSON array of sections, each
`{sectionName, content}`, where `content` is a list of typed blocks the lesson
renderer understands
(frontend/src/components/certifications/lesson-content-renderer.jsx).

This is a wider palette than `topcit_expansion/builders.py` exposes, and that
is deliberate. The TOPCIT bank was measured at 61.7% plain `description`, and
whole lessons there run twenty sections deep with a single paragraph in each --
correct material presented as an undifferentiated column of prose. The FE
syllabus is far more enumerable than TOPCIT's (radixes, OSI layers, sort
algorithms, PMBOK subject groups, named laws), and enumerable material is
exactly what tabs, accordions, comparison grids and annotated figures are for.

So every renderer block is available here, and a section is expected to carry
more than one kind. The floor the TOPCIT work established still holds -- match
the bank's overall feel, do not turn a lesson into a wall of coloured cards --
but the target mix here is richer:

    description      ~50%    the spine; still the majority
    subheading       ~13%    inside long sections
    lists            ~13%    unordered and ordered
    accordion/tabs   ~12%    reference material the learner opens on demand
    figures          ~ 6%    at least two per lesson, drawn not hotlinked
    grids/cards      ~ 6%    parallel items compared against each other

Ids are uuid4 to match what the generator produced, so a hand-written lesson
and a generated one are indistinguishable in the database.
"""

import uuid


def _id():
    return str(uuid.uuid4())


# ------------------------------------------------------------------ prose

def desc(text):
    """A paragraph. The spine of every lesson."""
    return {"type": "description", "data": {"text": text}}


def sub(text):
    """A subheading *inside* a section, below the section's own name."""
    return {"type": "subheading", "data": {"text": text}}


def heading(text):
    return {"type": "heading", "data": {"text": text}}


def ul(items):
    return {"type": "unordered-list",
            "data": {"items": [{"id": _id(), "text": t} for t in items]}}


def ol(items):
    """An ordered list. Use it only where the order is load-bearing -- a
    procedure, a precedence rule, a conversion algorithm -- never as a
    numbered version of an unordered set."""
    return {"type": "ordered-list",
            "data": {"items": [{"id": _id(), "text": t} for t in items]}}


def table(columns, rows, small_header=None, description=None, caption=None,
          footer=None, row_headers=True):
    """A real data table. `columns` is [label]; `rows` is [[cell, ...]].

    Prefer this to drawing a table as an SVG figure. A drawn table is a
    picture: it cannot be selected or copied, it ignores the reader's font
    size, it is invisible to search and to a screen reader, and on a phone it
    is a wide image shrunk until nothing is legible. This block is real text
    in a real `<table>`, and it reflows.

    Reach for it when several items are compared on the SAME named attributes
    -- encodings against their widths, RAID levels against what each
    survives, sort algorithms against their complexities. When the items have
    nothing in common but a heading, they are a list; when each needs a
    paragraph, they are subheadings and prose.

    Keep cells short. A cell holds a value or a phrase; a sentence in a cell
    is a sentence that wanted to be prose.
    """
    width = len(columns)
    for index, row in enumerate(rows):
        assert len(row) == width, (
            "table row %d has %d cells but there are %d columns: %r"
            % (index, len(row), width, row))
    return {"type": "table",
            "data": {"smallHeader": small_header, "description": description,
                     "caption": caption, "footer": footer,
                     "rowHeaders": row_headers,
                     "columns": [{"id": _id(), "label": label}
                                 for label in columns],
                     "rows": [{"id": _id(), "cells": list(row)}
                              for row in rows]}}


# ----------------------------------------------------------------- figures

def image(url, source_url=None, source_name=None):
    """A standalone figure.

    Every figure in this curriculum is an SVG we draw ourselves and ship from
    `frontend/public/lesson-media/`, so `imageKey` is a root-relative path and
    the attribution fields stay empty. The TOPCIT bank learned this the hard
    way: all 37 of its hotlinked diagrams eventually 403'd.
    """
    return {"type": "image",
            "data": {"file": None, "imageKey": url,
                     "imageSourceUrl": source_url,
                     "imageSourceName": source_name}}


def image_text(url, title, body, side="left"):
    """A figure beside explanatory prose. `side` is "left" or "right"."""
    return {"type": "image-%s-text" % side,
            "data": {"file": None, "imageKey": url, "title": title,
                     "description": body, "imageSourceUrl": None,
                     "imageSourceName": None}}


def media_text(url, small_header, description, supporting_title,
               supporting_body, layout="image-left"):
    """Figure and prose, under a small header and a lead-in line.

    Heavier than `image_text` -- it carries an intro above the pair -- so it
    suits the one figure in a section that the whole section is about.
    """
    return {"type": "media-text-block",
            "data": {"smallHeader": small_header, "description": description,
                     "mediaType": "image", "imageKey": url, "file": None,
                     "layout": layout, "supportingTitle": supporting_title,
                     "supportingDescription": supporting_body,
                     "imageSourceUrl": None, "imageSourceName": None}}


def intro_image(small_header, description, url):
    """A section's opening: a small header, a lead paragraph, then a figure."""
    return {"type": "intro-image-card",
            "data": {"smallHeader": small_header, "description": description,
                     "file": None, "imageKey": url,
                     "imageSourceUrl": None, "imageSourceName": None}}


def hotspot(url, small_header, description, points):
    """An annotated figure. `points` is [(x, y, title, body)], x/y in percent.

    Worth the effort only for a diagram whose *parts* each need a sentence --
    a CPU block diagram, an E-R diagram, a Gantt chart. For a figure that
    explains itself, `image` is the honest choice.
    """
    return {"type": "image-hotspot",
            "data": {"smallHeader": small_header, "description": description,
                     "file": None, "imageKey": url,
                     "imageSourceUrl": None, "imageSourceName": None,
                     "hotspots": [{"id": _id(), "x": x, "y": y,
                                   "title": t, "description": b}
                                  for x, y, t, b in points]}}


def video(video_key):
    return {"type": "video", "data": {"file": None, "videoKey": video_key}}


# -------------------------------------------------------------- disclosure

def accordion(pairs):
    """pairs: [(title, body)] -- collapsed rows the learner opens on demand.

    The right block for reference material that must be *present* but should
    not be *read straight through*: term glossaries, per-item detail behind a
    summary, the five things a learner will come back to look up.
    """
    return {"type": "accordion",
            "data": {"items": [{"id": _id(), "title": t, "content": b}
                               for t, b in pairs]}}


def tabs(triples):
    """triples: [(label, title, body)] -- a pill strip over one panel.

    For a small set of *alternatives compared on the same axes*: four sort
    algorithms, three RAID levels, the OSI layers. If the reader would want
    two of them side by side, use `compare_grid` instead -- tabs hide
    everything but one.
    """
    return {"type": "tabs",
            "data": {"items": [{"id": _id(), "label": lb, "title": ti,
                                "description": bo}
                               for lb, ti, bo in triples]}}


def content_accordion(small_header, description, pairs):
    """An accordion under its own small header and lead-in paragraph."""
    return {"type": "content-accordion-block",
            "data": {"smallHeader": small_header, "description": description,
                     "items": [{"id": _id(), "title": t, "content": b}
                               for t, b in pairs]}}


def content_tabs(small_header, description, triples):
    """Tabs under their own small header and lead-in paragraph."""
    return {"type": "content-tabs-block",
            "data": {"smallHeader": small_header, "description": description,
                     "items": [{"id": _id(), "label": lb, "title": ti,
                                "description": bo}
                               for lb, ti, bo in triples]}}


# ------------------------------------------------------------------ grids

def compare_grid(small_header, description, pairs, image_key=None):
    """pairs: [(title, body)] as a grid of cards, optionally under a figure.

    A real grid, not the flattened subheading-and-prose sequence the TOPCIT
    builders fall back to. The distinction the renderer's own comment draws is
    the right one: the card earns its box when the items are *parallel members
    of a set read by comparison with each other*, not when they are
    consecutive points in an argument. Four CPU addressing modes qualify; four
    stages of a lifecycle do not -- those are `ol`.

    Keep it to 2, 4 or 6 items so the two-column grid comes out square, and
    keep each body to a sentence or two: a paragraph in a card is a paragraph
    that wanted to be a paragraph.
    """
    block_type = "image-feature-grid" if image_key else "header-description-grid"
    data = {"smallHeader": small_header, "description": description,
            "gridItems": [{"id": _id(), "title": t, "description": b}
                          for t, b in pairs]}
    if image_key:
        data.update({"file": None, "imageKey": image_key,
                     "imageSourceUrl": None, "imageSourceName": None})
    return {"type": block_type, "data": data}


def flip_cards(triples):
    """triples: [(front, back, body)] -- cards that flip on click.

    Recall practice, and nothing else. A flip card hides its answer, so any
    content a learner needs while reading the *next* paragraph must not be in
    one. Reserved here for end-of-lesson review sections.
    """
    return {"type": "flip-grid",
            "data": {"cards": [{"id": _id(), "frontTitle": f,
                                "backTitle": b, "description": d}
                               for f, b, d in triples]}}


def review_cards(small_header, description, triples):
    """Flip cards under a small header and lead-in paragraph."""
    return {"type": "review-card-grid",
            "data": {"smallHeader": small_header, "description": description,
                     "cards": [{"id": _id(), "frontTitle": f,
                                "backTitle": b, "description": d}
                               for f, b, d in triples]}}


# ----------------------------------------------------------------- lesson

def lesson_structure(name, intro, objectives, minutes, sections,
                     key_terms, summary, exam_notes=None):
    """Assembles a lesson's section list in the order the whole bank uses.

    The first section carries the lesson's own name and no content -- that is
    the convention every existing lesson follows and the renderer relies on it
    for the title block -- then Introduction, Learning Objectives, the body,
    optionally an exam-focus section, then Key Terms and Summary.

    `sections` is [(section_name, blocks)]. A block entry may itself be a list,
    which is flattened here, so a content module can define a helper that
    returns several blocks at once without every call site unpacking it.

    SIZE THE BODY AT SIXTEEN SECTIONS OR MORE. The platform's minimum is 22
    sections and this function contributes six of its own -- the title,
    Introduction, Learning Objectives, the exam-focus section, Key Terms and
    Summary -- so a body of twelve, which is what a full-looking outline
    tends to produce, lands at eighteen and fails `check.py`. Counting the
    body sections while planning is much cheaper than discovering it
    afterwards, which the first several lessons here all did.
    """
    structure = [
        {"sectionName": name, "content": []},
        {"sectionName": "Introduction", "content": [desc(intro)]},
        {"sectionName": "Learning Objectives",
         "content": [ul(objectives),
                     desc("Estimated study time: %d minutes" % minutes)]},
    ]
    for section_name, blocks in sections:
        flattened = []
        for block in blocks:
            if isinstance(block, list):
                flattened.extend(block)
            else:
                flattened.append(block)
        structure.append({"sectionName": section_name, "content": flattened})

    if exam_notes:
        structure.append({"sectionName": "What the Examination Asks",
                          "content": list(exam_notes)})

    structure.append({"sectionName": "Key Terms",
                      "content": [accordion(key_terms)]})
    structure.append({"sectionName": "Summary", "content": [desc(summary)]})
    return structure


# --------------------------------------------------------------- questions

#: The three values `questions.difficulty_level` actually carries across the
#: whole bank. Anything else is silently unfilterable in the practice engine.
DIFFICULTIES = ("EASY", "AVERAGE", "HARD")


def _stable_hash(text):
    """A hash that is the same on every run and every machine.

    `hash()` is deliberately randomised per process for strings, so using it
    here would reorder every question's choices on each import -- which is the
    one thing this must not do.
    """
    import hashlib
    return int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)


def mcq(difficulty, question, choices, explanation):
    """choices: [(text, is_correct)] with exactly one correct.

    The choices are REORDERED here, deterministically, and that is the point
    of the function rather than an incidental detail.

    Writing an item, you think of the right answer first and the distractors
    afterwards, so the correct choice drifts towards the top of the list --
    measurably. A batch written by hand came out with the answer in position
    two nine times in ten, which is a tell a candidate can exploit without
    knowing any of the material, and it is exactly what the platform's own
    `_check_answer_positions` looks for.

    Rotating by a hash of the question text fixes it without any authoring
    discipline: the spread is even across a batch, and it is reproducible, so
    re-importing a module does not silently reshuffle a paper a learner is
    part-way through. Rotation rather than a shuffle keeps the distractors in
    the order they were written, which matters when they are graded values
    ("2.00", "2.80", "3.00") that read oddly out of sequence.
    """
    assert difficulty in DIFFICULTIES, "bad difficulty %r" % difficulty
    correct = [c for c in choices if c[1]]
    assert len(correct) == 1, "MCQ needs exactly one correct choice: %r" % question[:60]
    assert len(choices) == 4, "MCQ needs four choices: %r" % question[:60]

    return {"type": "MCQ", "difficulty": difficulty, "question": question,
            "choices": list(choices), "explanation": explanation}


def balance_answer_positions(quiz):
    """Spreads the correct choice evenly across the four positions.

    Writing an item, you think of the right answer first and the distractors
    afterwards, so the correct choice drifts to the top of the list --
    measurably. One batch here came out with the answer in position two nine
    times in ten, which is a tell a candidate can exploit while knowing none
    of the material, and it is exactly what the platform's
    `_check_answer_positions` looks for.

    Assigning slots ROUND-ROBIN across the batch rather than per question is
    what makes the spread exact. A per-question hash was tried first and is
    not good enough: over ten items a hash lands unevenly often enough to trip
    the same check, just in a different position. Round-robin over a batch of
    ten gives at most three in any slot, always.

    The starting offset is hashed from the first stem so different lessons do
    not all begin at position one, and the whole thing is deterministic -- so
    re-importing a module never reshuffles a paper a learner is part-way
    through.

    Non-MCQ items pass through untouched.
    """
    if not quiz:
        return quiz

    offset = _stable_hash(quiz[0]["question"])
    balanced, mcq_index = [], 0

    for item in quiz:
        if item["type"] != "MCQ":
            balanced.append(item)
            continue
        choices = item["choices"]
        correct = next(c for c in choices if c[1])
        others = [c for c in choices if not c[1]]
        slot = (offset + mcq_index) % len(choices)
        mcq_index += 1
        balanced.append(dict(item,
                             choices=others[:slot] + [correct] + others[slot:]))
    return balanced


def lesson(major, middle, name, quiz, structure):
    """Assembles the dict `seed.py` consumes, balancing the quiz on the way.

    Every content module ends by building this dict, so it is the one place
    guaranteed to see a finished quiz -- which makes it the right place to
    apply `balance_answer_positions`. Leaving that to each module to remember
    is the kind of discipline that holds for five lessons and fails somewhere
    around the fortieth.
    """
    return {"major": major, "middle": middle, "name": name,
            "quiz": balance_answer_positions(quiz), "structure": structure}


def short_answer(difficulty, question, answer, variations):
    """`variations` are alternative accepted spellings of the same answer.

    They are stored newline-joined, because AssessmentAttemptService splits on
    a newline. Comma-joining them stores one long string no learner will ever
    type, which silently kills every variation in the list.
    """
    assert difficulty in DIFFICULTIES, "bad difficulty %r" % difficulty
    assert variations, "short answer with no variations: %r" % question[:60]
    return {"type": "SHORT_ANSWER", "difficulty": difficulty,
            "question": question, "answer": answer, "variations": variations}


def descriptive(difficulty, question, answer, rubric):
    """rubric: [(criterion, max_points)]. Graded semantically by the AI."""
    assert difficulty in DIFFICULTIES, "bad difficulty %r" % difficulty
    assert rubric, "descriptive with no rubric: %r" % question[:60]
    return {"type": "DESCRIPTIVE", "difficulty": difficulty,
            "question": question, "answer": answer, "rubric": rubric}
