"""Reads questions out of any exam or reviewer PDF, not only ITPEC papers.

Two stages, neither of them a generative model:

1. LAYOUT -- Docling (MIT, local) turns each page into blocks in reading
   order: paragraphs, list items with their markers ("a)", "B."), section
   headings, and regions that are not running text -- pictures, tables,
   formulas, code. Two-column pages come back in reading order, and every
   block carries its position on the page, so a figure can be cropped exactly
   from the page image the browser already renders.

2. PROFILES -- a document numbers its questions one way ("Q12.", "Question 12",
   "12.") and letters its choices one way ("a)", "A.", "a."). Every pairing is
   tried and the one that reads the most complete questions -- consecutive
   numbers, two or more choices, an answer -- wins. A new layout is a new
   pattern here, not new code.

Figures are assigned by position: a picture, table, formula or code block
belongs to the question it appears in, and to a choice when it appears
between that choice's letter and the next. Answers come from an "Answer: B"
line inside a question or an "Answer key" section at the end; a separate key
file is matched in the browser as before.

Nothing is invented. A question that does not read cleanly is returned with
its problems named, for the reviewer or the AI page reader to deal with.
"""

from __future__ import annotations

import logging
import os
import re
import tempfile
import threading

logger = logging.getLogger(__name__)

#: How a question's number is printed. Each is tried in turn.
QUESTION_STYLES = [
    ("Q12.", re.compile(r"^Q\s?(\d{1,3})\s?[.:)]\s*")),
    ("Question 12", re.compile(r"^(?:Question|Item|No\.?)\s+(\d{1,3})\s*[.:)\-]?\s*", re.I)),
    ("12.", re.compile(r"^(\d{1,3})\s?[.)]\s+(?=\S)")),
]

#: How the choices are lettered: (name, marker pattern, case).
CHOICE_STYLES = [
    ("a)", re.compile(r"(?:^|(?<=\s))\(?([a-h])\)(?=\s|$)"), "lower"),
    ("A.", re.compile(r"(?:^|(?<=\s))\(?([A-H])[.)](?=\s|$)"), "upper"),
    ("a.", re.compile(r"(?:^|(?<=\s))([a-h])\.(?=\s)"), "lower"),
]

#: "Answer: B", "Ans. c", "Correct answer - (d)" inside a question.
INLINE_ANSWER = re.compile(
    r"(?:^|\s)(?:correct\s+)?ans(?:wer)?\s*[:.\-=]\s*\(?([A-Ha-h])\)?(?=[\s.,;]|$)", re.I)

#: The heading of an answer-key section at the end of the document.
KEY_HEADING = re.compile(
    r"^\s*(?:answer\s*key|answers?(?:\s+(?:and|&)\s+explanations?)?|key\s+to\s+correction|"
    r"answer\s+sheet|correct\s+answers?)\s*[:.]?\s*$", re.I)
KEY_PAIR = re.compile(r"(?:^|\s)(\d{1,3})\s*[.):\-=]?\s*\(?([A-Ha-h])\)?(?=[\s.,;]|$)")

#: Docling labels that are running text, and those cropped as figures.
TEXT_LABELS = {"text", "paragraph", "list_item", "section_header", "title", "caption",
               "checkbox_selected", "checkbox_unselected", "footnote", "reference"}
FIGURE_LABELS = {"picture", "table", "formula", "code", "chart"}
SKIPPED_LABELS = {"page_header", "page_footer"}
#: A page number as printed: "7", "- 12 -", "Page 7", "Page 7 of 40", "7/40".
#: Dropped only in the top or bottom eighth of the page (see `_is_page_number`),
#: where Docling sometimes labels it plain text rather than a footer.
PAGE_NUMBER = re.compile(r"^(?:[–—-]\s*)?(?:page\s*)?\d{1,4}(?:\s*(?:/|of)\s*\d{1,4})?(?:\s*[–—-])?$", re.I)


def _is_page_number(text, fraction):
    """A page-number line in the margin. A bare-number choice ("20") sits in
    the body and is kept; in the margin it would join the last choice."""
    return bool(PAGE_NUMBER.match(text)) and (fraction[3] < 0.12 or fraction[1] > 0.88)

_converter = None
_converter_ocr = None
_lock = threading.Lock()


def _make_converter(ocr: bool):
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption

    options = PdfPipelineOptions(do_ocr=ocr, do_table_structure=False)
    options.accelerator_options.num_threads = os.cpu_count() or 4
    return DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})


def _converter_for(ocr: bool):
    """Docling converters, built once -- loading the layout model takes seconds."""
    global _converter, _converter_ocr
    with _lock:
        if ocr:
            if _converter_ocr is None:
                _converter_ocr = _make_converter(True)
            return _converter_ocr
        if _converter is None:
            _converter = _make_converter(False)
        return _converter


def _needs_ocr(pdf_bytes: bytes) -> bool:
    """True when any page has no text layer -- a scan, or a scanned insert."""
    import pymupdf

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        return any(len(page.get_text().strip()) < 20 for page in doc)


def layout_blocks(pdf_bytes: bytes) -> tuple[list[dict], int, bool]:
    """(blocks in reading order, page count, whether OCR was used).

    Each block: {kind: "text"|"figure", text, page, box: [left, top, right,
    bottom] as fractions of the page, top-left origin}.
    """
    ocr = _needs_ocr(pdf_bytes)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as handle:
        handle.write(pdf_bytes)
        path = handle.name
    try:
        result = _converter_for(ocr).convert(path)
    finally:
        os.unlink(path)
    doc = result.document

    import pymupdf

    source = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    blocks = []
    for item, _level in doc.iterate_items():
        label = str(getattr(item, "label", "")).split(".")[-1].lower()
        if label in SKIPPED_LABELS or not getattr(item, "prov", None):
            continue
        prov = item.prov[0]
        size = doc.pages[prov.page_no].size
        box = prov.bbox.to_top_left_origin(page_height=size.height)
        fraction = [
            max(0.0, box.l / size.width), max(0.0, box.t / size.height),
            min(1.0, box.r / size.width), min(1.0, box.b / size.height),
        ]
        text = (getattr(item, "text", "") or "").strip()
        marker = (getattr(item, "marker", "") or "").strip()
        if label in FIGURE_LABELS:
            figure, choice_lines = _split_choices_out(source[prov.page_no - 1], fraction)
            if figure is not None:
                blocks.append({"kind": "figure", "label": label, "text": text,
                               "page": prov.page_no, "box": figure})
            for line_text, line_box in choice_lines:
                blocks.append({"kind": "text", "label": "list_item", "text": line_text,
                               "page": prov.page_no, "box": line_box})
        elif label in TEXT_LABELS or text:
            # Docling strips a list item's marker into its own field; the
            # profiles need it back in the text to find the choices.
            if marker and not text.startswith(marker):
                text = f"{marker} {text}".strip()
            if text and not _is_page_number(text, fraction):
                blocks.append({"kind": "text", "label": label, "text": text,
                               "page": prov.page_no, "box": fraction})
    source.close()
    return _without_running_lines(blocks, len(doc.pages)), len(doc.pages), ocr


def _in_margin(box):
    return box[3] < 0.12 or box[1] > 0.88


def _without_running_lines(blocks, page_count):
    """Drops running headers and footers: text in the top or bottom margin
    that repeats on several pages -- the exam's name, a school's header, a
    copyright line. Left in, one joins the last choice before each page
    break. Digits are ignored when comparing, so "Page 3" and "Page 4" are
    one line."""
    if page_count < 2:
        return blocks
    pages_with = {}
    for block in blocks:
        if block["kind"] == "text" and _in_margin(block["box"]):
            key = re.sub(r"\d+", "#", block["text"].lower()).strip()
            pages_with.setdefault(key, set()).add(block["page"])
    running = {key for key, pages in pages_with.items() if len(pages) >= max(2, page_count // 2)}
    return [
        block for block in blocks
        if not (block["kind"] == "text" and _in_margin(block["box"])
                and re.sub(r"\d+", "#", block["text"].lower()).strip() in running)
    ]


#: A printed line that begins with a choice letter: "(a) ...", "b) ...", "C. ..."
CHOICE_LINE = re.compile(r"^\(?[a-hA-H][.)]\s+\S")


def _split_choices_out(page, fraction):
    """(figure box or None, [(choice line text, box)]) for one figure region.

    The layout model sometimes takes a table and the lettered choices printed
    under it as one region; cropped whole, the choices would be lost from the
    question's text. The PDF's own text inside the region says where they
    start: the figure ends above the first line that begins with a choice
    letter, and those lines are returned as text.
    """
    width, height = page.rect.width, page.rect.height
    clip = pymupdf_rect(fraction, width, height)
    rows = {}
    for x0, y0, x1, y1, word, *_ in page.get_text("words", clip=clip):
        key = round((y0 + y1) / 2 / 3)
        rows.setdefault(key, []).append((x0, y0, x1, y1, word))
    lines = []
    for key in sorted(rows):
        words = sorted(rows[key])
        text = " ".join(w[4] for w in words)
        box = [min(w[0] for w in words) / width, min(w[1] for w in words) / height,
               max(w[2] for w in words) / width, max(w[3] for w in words) / height]
        lines.append((text, box))

    first = next((i for i, (text, _) in enumerate(lines) if CHOICE_LINE.match(text)), None)
    if first is None:
        return fraction, []
    top = lines[first][1][1]
    figure = None
    if top - fraction[1] > 0.02:  # something drawn above the choices to keep
        figure = [fraction[0], fraction[1], fraction[2], max(fraction[1], top - 0.004)]
    return figure, lines[first:]


def pymupdf_rect(fraction, width, height):
    import pymupdf

    return pymupdf.Rect(fraction[0] * width, fraction[1] * height,
                        fraction[2] * width, fraction[3] * height)


def _answer_key(blocks: list[dict]) -> tuple[list[dict], dict]:
    """(blocks before the answer-key section, {question number: letter})."""
    for index, block in enumerate(blocks):
        if block["kind"] == "text" and KEY_HEADING.match(block["text"]):
            answers = {}
            for later in blocks[index + 1:]:
                for number, letter in KEY_PAIR.findall(later["text"]):
                    answers.setdefault(number, letter.lower())
            if len(answers) >= 3:
                return blocks[:index], answers
    return blocks, {}


def _read_with(blocks, question_re, choice_re, case):
    """Questions under one numbering and one choice style."""
    questions = []
    current = None
    expected = None
    # The same heading found partway through a block: Docling sometimes
    # joins a question's last choice and the next question into one
    # paragraph ("(d) Neo4j Question 7: Which ...").
    mid_re = re.compile(r"(?<=\s)" + question_re.pattern.lstrip("^"), question_re.flags)

    def accept(number):
        # A heading only counts as the next question when its number is the
        # next one -- "3." inside a stem's own numbered list is not.
        return (expected is None and number <= 5) or number == expected

    def cover(question, block):
        # The part of each page the question occupies -- its "Show original".
        top, bottom = block["box"][1], block["box"][3]
        low, high = question["regions"].get(block["page"], (top, bottom))
        question["regions"][block["page"]] = (min(low, top), max(high, bottom))

    for block in blocks:
        if block["kind"] != "text":
            if current is not None:
                cover(current, block)
                current["pages"].add(block["page"])
                current["tokens"].append(("figure", {"page": block["page"], "box": block["box"],
                                                     "label": block["label"]}))
            continue
        text = block["text"]
        while text:
            match = question_re.match(text)
            if match and accept(int(match.group(1))):
                number = int(match.group(1))
                current = {"num": str(number), "tokens": [], "pages": {block["page"]}, "regions": {}}
                questions.append(current)
                cover(current, block)
                expected = number + 1
                text = text[match.end():].strip()
                continue
            split = next((m.start() for m in mid_re.finditer(text)
                          if m.start() > 0 and accept(int(m.group(1)))), None)
            head = (text if split is None else text[:split]).strip()
            if head and current is not None:
                current["pages"].add(block["page"])
                cover(current, block)
                current["tokens"].append(("text", head))
            if split is None:
                break
            text = text[split:]

    out = []
    for question in questions:
        stem_parts, figures, options, answer = [], [], [], None
        target = None  # None = the stem; otherwise an option dict
        want = "a" if case == "lower" else "A"
        for kind, value in question["tokens"]:
            if kind == "figure":
                if target is None:
                    figures.append(value)
                elif target["figure"] is None and not target["text"]:
                    target["figure"] = value
                else:
                    figures.append(value)
                continue
            text = value
            found = INLINE_ANSWER.search(text)
            if found:
                answer = found.group(1).lower()
                text = (text[:found.start()] + text[found.end():]).strip()
            cursor = 0
            for mark in choice_re.finditer(text):
                if mark.group(1) != want:
                    continue
                piece = text[cursor:mark.start()].strip()
                if piece and target is None:
                    stem_parts.append(piece)
                elif piece:
                    target["text"] = (target["text"] + " " + piece).strip()
                target = {"key": want.lower(), "text": "", "figure": None}
                options.append(target)
                cursor = mark.end()
                want = chr(ord(want) + 1)
            piece = text[cursor:].strip()
            if piece:
                if target is None:
                    stem_parts.append(piece)
                else:
                    target["text"] = (target["text"] + " " + piece).strip()

        issues = []
        if len(options) < 2:
            issues.append("choices were not found")
        elif any(not o["text"] and not o["figure"] for o in options):
            issues.append("a choice is empty")
        out.append({
            "num": question["num"],
            "stem": re.sub(r"[ \t]+", " ", "\n".join(stem_parts)).strip(),
            "options": options,
            "figures": figures,
            "answer": answer,
            "pages": sorted(question["pages"]),
            "regions": [{"page": page, "top": top, "bottom": bottom}
                        for page, (top, bottom) in sorted(question["regions"].items())],
            "issues": issues,
        })
    return out


def _score(questions, answers):
    if len(questions) < 2:
        return 0.0
    good = sum(1 for q in questions if not q["issues"])
    answered = sum(1 for q in questions if q["answer"] or answers.get(q["num"]))
    return good + 0.3 * answered


def read_document(pdf_bytes: bytes) -> dict:
    """Every question in the PDF under its best-reading profile.

    Returns {profile, questions, answers, pages, ocr, complete, total}; each
    question {num, stem, options: [{key, text, figure}], figures: [{page,
    box}], answer, pages, issues}. Boxes are fractions of the page, top-left
    origin, so the browser can crop them from its own render at any scale.
    """
    blocks, page_count, ocr = layout_blocks(pdf_bytes)
    body, key = _answer_key(blocks)

    best = None
    for q_name, q_re in QUESTION_STYLES:
        for c_name, c_re, case in CHOICE_STYLES:
            questions = _read_with(body, q_re, c_re, case)
            score = _score(questions, key)
            if best is None or score > best[0]:
                best = (score, f"{q_name} / {c_name}", questions)

    score, profile, questions = best or (0.0, None, [])
    for question in questions:
        if not question["answer"] and key.get(question["num"]):
            question["answer"] = key[question["num"]]
    complete = sum(1 for q in questions if not q["issues"])
    logger.info("Layout reader: %s, %d questions, %d complete, %d pages%s",
                profile, len(questions), complete, page_count, " (OCR)" if ocr else "")
    return {
        "profile": profile,
        "questions": questions,
        "answers": key,
        "pages": page_count,
        "ocr": ocr,
        "total": len(questions),
        "complete": complete,
    }
