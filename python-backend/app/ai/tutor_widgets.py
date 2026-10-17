"""Interactive pieces the AI tutor can put in its answer: practice (quiz,
flashcards, matching, ordering, fill-in, true/false), explanations (tables,
cards, worked steps, code, math, diagrams) and a live slider explorer.

They are tools the model calls instead of writing the same thing as markdown.
A call is never answered -- nothing is run and no result goes back to the
model (single-turn, so every provider in the tutor chain can do it, Gemini
included). Its arguments ARE the widget: they are checked and trimmed here,
streamed to the learner as a `widget` event, and saved on the message.

The schemas are deliberately loose (few required fields, plain types): a
provider that validates tool arguments server-side rejects the whole turn on
one mismatch, so tolerance lives here in `normalize` instead.
"""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, Field

MAX_WIDGETS = 3


class QuizQuestion(BaseModel):
    question: str = Field(description="The question stem.")
    options: list[str] = Field(description="2-6 answer choices.")
    correct_index: int = Field(description="0-based index of the correct option.")
    explanation: str = Field(default="", description="One sentence on why the answer is right.")


class show_quiz(BaseModel):
    """Show an interactive multiple-choice practice quiz the learner answers in
    the chat. Use when the learner asks for practice problems, a quiz, or to
    test themselves. Each question gets instant right/wrong feedback."""

    title: str = Field(description="Short quiz title, e.g. 'IPv4 Address Classes'.")
    questions: list[QuizQuestion] = Field(description="3-10 questions.")
    hint: str = Field(default="", description="Optional hint the learner can reveal, e.g. a range table in markdown.")


class show_table(BaseModel):
    """Show a comparison table. Use when the answer compares several items
    across the same attributes (classes, protocols, layers, models)."""

    columns: list[str] = Field(description="Column headers, 2-6.")
    rows: list[list[str]] = Field(description="Rows; each row has one cell per column.")
    caption: str = Field(default="", description="Optional one-line note under the table.")


class Card(BaseModel):
    title: str = Field(description="Card heading, e.g. 'Class A -- Very large company'.")
    detail: str = Field(default="", description="One short line, e.g. 'Example: 10.0.0.0/8'.")
    highlight: str = Field(default="", description="The key figure or takeaway, e.g. '16,777,214 usable hosts'.")
    icon: str = Field(default="", description="One of: building, home, server, network, cloud, user, lock, book, chart, lightbulb.")


class show_cards(BaseModel):
    """Show a set of illustrated cards, one per item. Use for concrete
    side-by-side examples or scenarios (three company sizes, three attack
    types) that read better as cards than as a list."""

    title: str = Field(default="", description="Optional heading above the cards.")
    cards: list[Card] = Field(description="2-6 cards.")


class Flashcard(BaseModel):
    front: str = Field(description="Term or question.")
    back: str = Field(description="Definition or answer, one or two sentences.")


class show_flashcards(BaseModel):
    """Show flip flashcards. Use when the learner wants to memorise terms,
    definitions, port numbers, acronyms or facts."""

    title: str = Field(default="", description="Deck title.")
    cards: list[Flashcard] = Field(description="3-12 cards.")


class Step(BaseModel):
    title: str = Field(description="Short step name, e.g. 'Find the network bits'.")
    detail: str = Field(description="What to do and the result, 1-3 sentences; markdown allowed.")


class show_steps(BaseModel):
    """Show a worked example the learner reveals one step at a time. Use for
    calculations and procedures (subnetting, conversions, algorithms) or when
    the learner asks how to solve something."""

    problem: str = Field(description="The problem being solved.")
    steps: list[Step] = Field(description="2-8 steps in order.")
    answer: str = Field(default="", description="The final answer.")


class Pair(BaseModel):
    term: str
    match: str


class show_matching(BaseModel):
    """Show a match-the-pairs exercise (term to definition, protocol to port,
    layer to device). Use for recall practice on 3-6 related pairs."""

    title: str = Field(default="", description="Instruction, e.g. 'Match each protocol to its port'.")
    pairs: list[Pair] = Field(description="3-6 pairs.")


class show_ordering(BaseModel):
    """Show a put-in-order exercise. Use for sequences: process steps,
    OSI layers, handshake messages, a lifecycle."""

    title: str = Field(description="Instruction, e.g. 'Order the TCP handshake'.")
    items: list[str] = Field(description="3-7 items in the CORRECT order; REBYU shuffles them.")
    explanation: str = Field(default="", description="One sentence on why this order.")


class Blank(BaseModel):
    sentence: str = Field(description="Sentence with the missing part written as ___ .")
    answer: str = Field(description="The missing word or number.")
    alternatives: list[str] = Field(default=[], description="Other accepted spellings.")


class show_fill_blank(BaseModel):
    """Show fill-in-the-blank recall questions with typed answers. Use for key
    terms and short numeric facts."""

    title: str = Field(default="", description="Short title.")
    blanks: list[Blank] = Field(description="2-8 sentences.")


class Claim(BaseModel):
    statement: str
    is_true: bool
    explanation: str = Field(default="", description="One sentence on why.")


class show_true_false(BaseModel):
    """Show a true-or-false myth-buster round. Use to surface common
    misconceptions about the topic."""

    title: str = Field(default="", description="Short title, e.g. 'Myth or fact?'.")
    claims: list[Claim] = Field(description="3-8 statements.")


class show_code(BaseModel):
    """Show a code snippet with syntax highlighting and a copy button. Use for
    ANY code, commands, configs or pseudocode instead of a markdown code block."""

    language: str = Field(default="text", description="e.g. python, java, sql, bash, text.")
    code: str = Field(description="The code.")
    caption: str = Field(default="", description="Optional one-line note on what it does.")


class MathStep(BaseModel):
    latex: str = Field(description="One line of LaTeX, without $ delimiters.")
    note: str = Field(default="", description="Short plain-text note on this line.")


class show_math(BaseModel):
    """Show typeset math: a formula, or a derivation line by line. Use for ANY
    equation or calculation instead of writing math as plain text."""

    title: str = Field(default="", description="Optional heading.")
    steps: list[MathStep] = Field(description="1-8 lines of LaTeX.")


class show_diagram(BaseModel):
    """Draw a diagram with Mermaid syntax: flowcharts, sequence diagrams,
    state machines, class/ER diagrams, timelines, mind maps. Use when a picture
    explains a process, structure or exchange better than words (handshakes,
    packet flow, algorithms, hierarchies). Real photos are not available."""

    title: str = Field(default="", description="Optional heading.")
    mermaid: str = Field(description="Valid Mermaid source, e.g. 'sequenceDiagram\\n  Client->>Server: SYN'. Put labels with punctuation in double quotes.")


class Variable(BaseModel):
    name: str = Field(description="Identifier used in formulas, e.g. prefix.")
    label: str = Field(default="", description="Slider label, e.g. 'Prefix length (/n)'.")
    min: float
    max: float
    step: float = 1
    value: float = Field(description="Starting value.")


class Output(BaseModel):
    label: str = Field(description="e.g. 'Usable hosts'.")
    formula: str = Field(description="Expression over the variables using + - * / ^ % ( ) and floor ceil round "
                                     "abs sqrt log log2 log10 exp min max pow, constants pi e.")
    format: str = Field(default="number", description="number, percent (0-1 shown as %), or binary.")


class show_explorer(BaseModel):
    """Show an interactive explorer: sliders the learner drags, and results
    that recompute live. Use when a relationship is best understood by
    changing the inputs -- prefix length vs hosts, trials vs probability,
    bits vs values, rate vs time."""

    title: str = Field(description="e.g. 'Prefix length vs hosts'.")
    variables: list[Variable] = Field(description="1-4 sliders.")
    outputs: list[Output] = Field(description="1-5 computed results.")
    note: str = Field(default="", description="One sentence on what to notice while dragging.")


class MindLeaf(BaseModel):
    label: str = Field(description="2-6 words.")
    note: str = Field(default="", description="Optional one-line explanation shown on click.")


class MindBranch(BaseModel):
    label: str = Field(description="Main idea, 1-4 words.")
    note: str = Field(default="", description="Optional one-line explanation shown on click.")
    children: list[MindLeaf] = Field(default=[], description="2-5 sub-ideas.")


class show_mindmap(BaseModel):
    """Show an interactive mind map of a lesson or topic: the central idea,
    its main branches and their sub-ideas. Use when the learner asks for a
    mind map, an overview, the big picture, a summary of the lesson, or how
    its ideas connect."""

    center: str = Field(description="The central topic, 1-5 words.")
    branches: list[MindBranch] = Field(description="3-7 main branches.")


TOOLS = [show_quiz, show_table, show_cards, show_flashcards, show_steps,
         show_matching, show_ordering, show_fill_blank, show_true_false,
         show_code, show_math, show_diagram, show_explorer, show_mindmap]

TOOL_RULES = """
    Interactive answers -- you have tools that render inside the chat. They are
    what makes REBYU better than a plain chatbot. Decide BEFORE writing: if the
    request matches a row below, you MUST call that tool (and not write the same
    content as text, markdown lists or markdown tables):
    - practice, a quiz, quiz me, test me, practice problems .. show_quiz
      (make it a full quiz of 5-10 questions when they ask to generate one)
      (asked again? vary: show_true_false for misconceptions, show_matching for
      pairs, show_ordering for sequences, show_fill_blank for key terms)
    - memorise, remember, flashcards, drill me ............... show_flashcards
      (8-12 cards when they ask to generate a set)
    - mind map, overview, big picture, summarise the lesson .. show_mindmap
    - how do I solve / find / calculate / convert X .......... show_steps
    - compare, difference between, vs, X and Y and Z ......... show_table
      (any 2+ items described on the same attributes is a table)
    - concrete side-by-side examples or scenarios ............ show_cards
    - formula, equation, derivation, any math expression ..... show_math
    - code, command, config, pseudocode ...................... show_code
    - draw, diagram, flow, how X travels/works step-to-step,
      sequence of messages, hierarchy, architecture .......... show_diagram
    - what happens to Y as X changes / if I change X, how does
      X affect Y, any relationship between numbers ........... show_explorer
      (give the learner a slider for X and the live formula for Y -- far
      better than describing the trend in words)
    A plain conceptual question ("what is X?", "why...?") gets plain text, no tool.
    Pick the ONE best tool (at most three for a request that clearly needs
    several). Write one or two sentences of text with the tool -- never repeat
    the tool's content in the text. The word limits above apply to your text,
    not to tool content. Quizzes, flashcards and mind maps are saved to the
    learner's Library automatically -- you may say so in one short clause.
    """


def _text(value: Any, limit: int) -> str:
    return str(value or "").strip()[:limit]


def _list(args: dict, key: str, limit: int) -> list[dict]:
    return [r for r in (args.get(key) or [])[:limit] if isinstance(r, dict)]


def _number(value: Any, default: float | None = None) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if number == number and abs(number) < 1e12 else default


def _quiz(args: dict) -> dict | None:
    questions = []
    for raw in _list(args, "questions", 10):
        options = [o for o in (_text(o, 200) for o in (raw.get("options") or [])[:6]) if o]
        try:
            correct = int(raw.get("correct_index", raw.get("correctIndex", -1)))
        except (TypeError, ValueError):
            continue
        stem = _text(raw.get("question"), 500)
        if not stem or len(options) < 2 or not 0 <= correct < len(options):
            continue
        questions.append({"question": stem, "options": options, "correctIndex": correct,
                          "explanation": _text(raw.get("explanation"), 500)})
    if not questions:
        return None
    return {"type": "quiz", "title": _text(args.get("title"), 120) or "Practice",
            "questions": questions, "hint": _text(args.get("hint"), 2000)}


def _table(args: dict) -> dict | None:
    columns = [_text(c, 80) for c in (args.get("columns") or [])][:6]
    if len(columns) < 2:
        return None
    rows = []
    for raw in (args.get("rows") or [])[:12]:
        if isinstance(raw, list):
            cells = [_text(c, 200) for c in raw][:len(columns)]
            rows.append(cells + [""] * (len(columns) - len(cells)))
    if not rows:
        return None
    return {"type": "table", "columns": columns, "rows": rows, "caption": _text(args.get("caption"), 300)}


def _cards(args: dict) -> dict | None:
    cards = [{key: _text(r.get(key), 200) for key in ("title", "detail", "highlight", "icon")}
             for r in _list(args, "cards", 6)]
    cards = [c for c in cards if c["title"]]
    return {"type": "cards", "title": _text(args.get("title"), 120), "cards": cards} if cards else None


def _flashcards(args: dict) -> dict | None:
    cards = [{"front": _text(r.get("front"), 200), "back": _text(r.get("back"), 500)}
             for r in _list(args, "cards", 12)]
    cards = [c for c in cards if c["front"] and c["back"]]
    return {"type": "flashcards", "title": _text(args.get("title"), 120), "cards": cards} if cards else None


def _steps(args: dict) -> dict | None:
    steps = [{"title": _text(r.get("title"), 120), "detail": _text(r.get("detail"), 800)}
             for r in _list(args, "steps", 8)]
    steps = [st for st in steps if st["title"] or st["detail"]]
    problem = _text(args.get("problem"), 500)
    if not problem or len(steps) < 2:
        return None
    return {"type": "steps", "problem": problem, "steps": steps, "answer": _text(args.get("answer"), 300)}


def _matching(args: dict) -> dict | None:
    pairs = [{"term": _text(r.get("term"), 120), "match": _text(r.get("match"), 200)}
             for r in _list(args, "pairs", 6)]
    pairs = [p for p in pairs if p["term"] and p["match"]]
    if len(pairs) < 2 or len({p["match"] for p in pairs}) < len(pairs):
        return None
    return {"type": "matching", "title": _text(args.get("title"), 160), "pairs": pairs}


def _ordering(args: dict) -> dict | None:
    items = [i for i in (_text(i, 200) for i in (args.get("items") or [])[:7]) if i]
    if len(items) < 3 or len(set(items)) < len(items):
        return None
    return {"type": "ordering", "title": _text(args.get("title"), 160) or "Put these in order",
            "items": items, "explanation": _text(args.get("explanation"), 400)}


def _fill_blank(args: dict) -> dict | None:
    blanks = []
    for r in _list(args, "blanks", 8):
        sentence, answer = _text(r.get("sentence"), 400), _text(r.get("answer"), 80)
        if sentence and answer and "___" in sentence:
            alts = [a for a in (_text(a, 80) for a in (r.get("alternatives") or [])) if a][:5]
            blanks.append({"sentence": sentence, "answer": answer, "alternatives": alts})
    return {"type": "fill_blank", "title": _text(args.get("title"), 120), "blanks": blanks} if blanks else None


def _true_false(args: dict) -> dict | None:
    claims = []
    for r in _list(args, "claims", 8):
        statement = _text(r.get("statement"), 300)
        value = r.get("is_true", r.get("isTrue"))
        if statement and isinstance(value, bool):
            claims.append({"statement": statement, "isTrue": value,
                           "explanation": _text(r.get("explanation"), 400)})
    if not claims:
        return None
    return {"type": "true_false", "title": _text(args.get("title"), 120) or "Myth or fact?", "claims": claims}


def _code(args: dict) -> dict | None:
    code = str(args.get("code") or "").strip("\n")[:6000]
    if not code.strip():
        return None
    language = re.sub(r"[^a-z0-9+#-]", "", _text(args.get("language"), 30).lower()) or "text"
    return {"type": "code", "language": language, "code": code, "caption": _text(args.get("caption"), 300)}


def _math(args: dict) -> dict | None:
    steps = [{"latex": _text(r.get("latex"), 600).strip("$ "), "note": _text(r.get("note"), 200)}
             for r in _list(args, "steps", 8)]
    steps = [st for st in steps if st["latex"]]
    return {"type": "math", "title": _text(args.get("title"), 120), "steps": steps} if steps else None


def _diagram(args: dict) -> dict | None:
    source = re.sub(r"^```(?:mermaid)?\s*|\s*```$", "", str(args.get("mermaid") or "").strip())[:4000]
    # No click handlers or init directives: the source is model-written.
    if not source or re.search(r"\bclick\b|%%\{", source):
        return None
    return {"type": "diagram", "title": _text(args.get("title"), 120), "mermaid": source}


_NAME = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,30}$")


def _explorer(args: dict) -> dict | None:
    variables = []
    for r in _list(args, "variables", 4):
        name, low, high = str(r.get("name") or ""), _number(r.get("min")), _number(r.get("max"))
        if not _NAME.match(name) or low is None or high is None or high <= low:
            continue
        value = min(max(_number(r.get("value"), low), low), high)
        variables.append({"name": name, "label": _text(r.get("label"), 80) or name, "min": low, "max": high,
                          "step": abs(_number(r.get("step"), 1) or 1), "value": value})
    outputs = [{"label": _text(r.get("label"), 80), "formula": _text(r.get("formula"), 300),
                "format": r.get("format") if r.get("format") in ("number", "percent", "binary") else "number"}
               for r in _list(args, "outputs", 5)]
    outputs = [o for o in outputs if o["label"] and o["formula"]]
    if not variables or not outputs:
        return None
    return {"type": "explorer", "title": _text(args.get("title"), 120), "variables": variables,
            "outputs": outputs, "note": _text(args.get("note"), 300)}


def _mindmap(args: dict) -> dict | None:
    center = _text(args.get("center"), 80)
    branches = []
    for r in _list(args, "branches", 7):
        children = [{"label": _text(c.get("label"), 80), "note": _text(c.get("note"), 300)}
                    for c in _list(r, "children", 5)]
        label = _text(r.get("label"), 60)
        if label:
            branches.append({"label": label, "note": _text(r.get("note"), 300),
                             "children": [c for c in children if c["label"]]})
    if not center or len(branches) < 2:
        return None
    return {"type": "mindmap", "center": center, "branches": branches}


_BUILDERS = {
    "show_mindmap": _mindmap,
    "show_quiz": _quiz, "show_table": _table, "show_cards": _cards, "show_flashcards": _flashcards,
    "show_steps": _steps, "show_matching": _matching, "show_ordering": _ordering,
    "show_fill_blank": _fill_blank, "show_true_false": _true_false, "show_code": _code,
    "show_math": _math, "show_diagram": _diagram, "show_explorer": _explorer,
}


def normalize(name: str, args: Any) -> dict | None:
    """The widget a tool call describes, or None when it is unusable."""
    builder = _BUILDERS.get(name)
    if builder is None or not isinstance(args, dict):
        return None
    return builder(args)


def _describe_one(w: dict) -> str:
    kind = w["type"]
    if kind == "quiz":
        return "\n".join([f"[Quiz shown: {w['title']}]"] + [
            f"{i}. {q['question']} -- answer: {q['options'][q['correctIndex']]}"
            for i, q in enumerate(w["questions"], 1)])
    if kind == "table":
        return "[Table shown: " + " | ".join(w["columns"]) + "]"
    if kind == "cards":
        return "[Cards shown: " + ", ".join(c["title"] for c in w["cards"]) + "]"
    if kind == "flashcards":
        return "[Flashcards shown: " + ", ".join(c["front"] for c in w["cards"]) + "]"
    if kind == "steps":
        return f"[Worked example shown: {w['problem']} -- answer: {w['answer']}]"
    if kind == "matching":
        return "[Matching shown: " + "; ".join(f"{p['term']} = {p['match']}" for p in w["pairs"]) + "]"
    if kind == "ordering":
        return f"[Ordering shown: {w['title']} -- correct order: " + " > ".join(w["items"]) + "]"
    if kind == "fill_blank":
        return "[Fill-in shown: " + "; ".join(f"{b['sentence']} ({b['answer']})" for b in w["blanks"]) + "]"
    if kind == "true_false":
        return "[True/false shown: " + "; ".join(
            f"{c['statement']} ({'true' if c['isTrue'] else 'false'})" for c in w["claims"]) + "]"
    if kind == "code":
        return f"[Code shown ({w['language']}):\n{w['code'][:1500]}]"
    if kind == "math":
        return "[Math shown: " + " ; ".join(st["latex"] for st in w["steps"]) + "]"
    if kind == "diagram":
        return f"[Diagram shown: {w['title'] or w['mermaid'][:200]}]"
    if kind == "explorer":
        return f"[Explorer shown: {w['title']} -- " + "; ".join(
            f"{o['label']} = {o['formula']}" for o in w["outputs"]) + "]"
    if kind == "mindmap":
        return f"[Mind map shown: {w['center']} -- " + "; ".join(
            b["label"] + (" (" + ", ".join(c["label"] for c in b["children"]) + ")" if b["children"] else "")
            for b in w["branches"]) + "]"
    return ""


def describe(widgets: list[dict]) -> str:
    """A plain-text note of what was shown, so later turns know about it
    ("why is question 3 B?") without replaying a tool call."""
    return "\n".join(filter(None, (_describe_one(w) for w in widgets)))
