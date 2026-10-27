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
MIN_ACTIVITY_ITEMS = 10
MAX_ACTIVITY_ITEMS = 20
MIN_QUIZ_QUESTIONS = MIN_ACTIVITY_ITEMS
MAX_QUIZ_QUESTIONS = 20


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
    questions: list[QuizQuestion] = Field(description="10-20 questions, default 10. Honour the requested count exactly.")
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
    cards: list[Flashcard] = Field(description="10-20 distinct cards, default 10. Honour the requested count exactly.")


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
    layer to device). Use for recall practice on 10-20 related pairs."""

    title: str = Field(default="", description="Instruction, e.g. 'Match each protocol to its port'.")
    pairs: list[Pair] = Field(description="10-20 distinct pairs, default 10. Honour the requested count exactly.")


class show_ordering(BaseModel):
    """Show a put-in-order exercise. Use for sequences: process steps,
    OSI layers, handshake messages, a lifecycle."""

    title: str = Field(description="Instruction, e.g. 'Order the TCP handshake'.")
    items: list[str] = Field(description="10-20 distinct items in the CORRECT order; default 10. REBYU shuffles them.")
    explanation: str = Field(default="", description="One sentence on why this order.")


class Blank(BaseModel):
    sentence: str = Field(description="Sentence with the missing part written as ___ .")
    answer: str = Field(description="The missing word or number.")
    alternatives: list[str] = Field(default=[], description="Other accepted spellings.")


class show_fill_blank(BaseModel):
    """Show fill-in-the-blank recall questions with typed answers. Use for key
    terms and short numeric facts."""

    title: str = Field(default="", description="Short title.")
    blanks: list[Blank] = Field(description="10-20 distinct sentences with blanks, default 10.")


class Claim(BaseModel):
    statement: str
    is_true: bool
    explanation: str = Field(default="", description="One sentence on why.")


class show_true_false(BaseModel):
    """Show a true-or-false myth-buster round. Use to surface common
    misconceptions about the topic."""

    title: str = Field(default="", description="Short title, e.g. 'Myth or fact?'.")
    claims: list[Claim] = Field(description="10-20 distinct statements, default 10. Honour the requested count exactly.")


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


class SortGroup(BaseModel):
    name: str
    items: list[str] = Field(description="Lesson-based items that belong ONLY in this category; use 10-20 items TOTAL across all groups, default 10.")


class show_sorting(BaseModel):
    """A drag-and-drop categorizing game. Every item must have exactly one unambiguous category."""
    title: str
    groups: list[SortGroup] = Field(description="2-4 distinct categories.")
    explanation: str = ""


class WordClue(BaseModel):
    word: str = Field(description="One lesson keyword, 3-14 English letters, no spaces.")
    clue: str = Field(description="Accurate lesson-based definition, not the answer itself.")


class show_word_game(BaseModel):
    """Create a word search, crossword, hangman or unscramble game from lesson vocabulary."""
    title: str
    variant: str = Field(description="Exactly word_search, crossword, hangman or unscramble, matching the request.")
    words: list[WordClue] = Field(description="10-20 unique vocabulary words with clues, default 10.")


class show_puzzle(BaseModel):
    """Create a jigsaw or sliding-tile puzzle of an educational concept diagram."""
    title: str
    variant: str = Field(description="jigsaw or sliding, as requested.")
    labels: list[str] = Field(description="Exactly 9 short lesson concepts in logical reading order; rendered as a diagram.")
    explanation: str = Field(description="Explain how the completed diagram relates to the lesson.")


class SceneObject(BaseModel):
    label: str = Field(description="Unique lesson-related object name.")
    symbol: str = Field(description="A single recognizable emoji representing this object.")
    changed_symbol: str = Field(default="", description="Different emoji for a changed object; blank for unchanged objects.")
    position: int = Field(description="Unique grid cell 0-15.")


class show_visual_game(BaseModel):
    """Spot-the-difference or hidden-object game in an illustrated educational scene."""
    title: str
    variant: str = Field(description="spot_difference or hidden_objects, as requested.")
    objects: list[SceneObject] = Field(description="8-12 unique objects; use changed_symbol on 3-5 for spot_difference.")
    targets: list[str] = Field(description="3-5 labels to find for hidden_objects; changed object labels for spot_difference.")
    explanation: str = ""


class show_speed_flashcards(BaseModel):
    """A timed speed round of lesson flashcards, with a timer and self-assessment."""
    title: str
    cards: list[Flashcard] = Field(description="10-20 concise cards, default 10.")
    seconds: int = Field(default=15, description="Seconds per card, 5-60.")


class StoryChoice(BaseModel):
    text: str
    next_id: str
    feedback: str = Field(default="", description="One or two plain sentences: the consequence of this choice and the lesson concept it shows.")


class StoryNode(BaseModel):
    id: str
    text: str = Field(description="A concrete scenario or ending. Explain the lesson-based consequence at endings.")
    choices: list[StoryChoice] = Field(default=[], description="2-3 choices, or empty for an ending.")
    ending_title: str = Field(default="", description="Endings only: a short name for this ending, e.g. 'Licensed and safe'.")
    outcome: str = Field(default="", description="Endings only: best, mixed or poor — how well this ending applies the lesson.")


class show_branching_story(BaseModel):
    """A lesson-grounded branching story where decisions lead to different outcomes."""
    title: str
    role: str
    start_id: str
    nodes: list[StoryNode] = Field(description="Exactly the requested 10-20 reachable decision nodes (default 10), plus at least two ending nodes. Share later nodes between branches to keep the story compact. All next_id references must exist. No loops.")
    concept: str = Field(default="", description="Optional: the lesson concept this story practises, under 10 words.")
    takeaway: str = Field(default="", description="Optional: one sentence on what the best path shows about the lesson.")


class SimulationResource(BaseModel):
    name: str
    initial: float
    minimum: float = 0
    description: str = Field(default="", description="Optional: what this resource stands for in the lesson, under 12 words.")


class ResourceEffect(BaseModel):
    resource: str
    delta: float


class SimulationChoice(BaseModel):
    text: str
    effects: list[ResourceEffect]
    feedback: str = Field(description="One or two plain sentences: what this choice changed and why, naming the lesson concept it shows.")


class SimulationRound(BaseModel):
    situation: str
    choices: list[SimulationChoice]


class show_simulation(BaseModel):
    """A resource-constrained simulation or role-play, such as running a budget. Choices apply deterministic resource changes."""
    title: str
    role: str
    goal: str
    resources: list[SimulationResource] = Field(description="1-3 resources, e.g. Budget and Quality. Every initial value must meet its minimum.")
    target_resource: str
    target_minimum: float = Field(description="Achievable end-of-simulation target for target_resource.")
    rounds: list[SimulationRound] = Field(description="10-20 rounds (default 10), with 2-3 concise choices each. Choice text names the action only; costs go in effects. Ensure at least one legal path reaches the target without falling below any resource minimum.")
    concept: str = Field(default="", description="Optional: the lesson concept this simulation practises, under 10 words.")
    takeaway: str = Field(default="", description="Optional: one-sentence lesson takeaway shown on the end screen.")


class TruthLieRound(BaseModel):
    statements: list[str] = Field(description="Exactly three distinct statements: two true, one false.")
    false_index: int = Field(description="Zero-based index of the ONLY false statement.")
    explanation: str = Field(description="Correct the false statement and briefly explain why the other two are true.")


class show_two_truths_lie(BaseModel):
    """Two truths and a lie: choose the false statement in each round."""
    title: str
    rounds: list[TruthLieRound] = Field(description="10-20 varied lesson-grounded rounds, default 10.")


TOOLS = [show_quiz, show_table, show_cards, show_flashcards, show_steps,
         show_matching, show_ordering, show_fill_blank, show_true_false,
         show_code, show_math, show_diagram, show_explorer, show_mindmap,
         show_sorting, show_word_game, show_speed_flashcards,
         show_branching_story, show_simulation, show_two_truths_lie]

TOOL_RULES = """
    Interactive answers -- you have tools that render inside the chat. They are
    what makes REBYU better than a plain chatbot. Decide BEFORE writing: if the
    request matches a row below, you MUST call that tool (and not write the same
    content as text, markdown lists or markdown tables):
    - practice, a quiz, quiz me, test me, practice problems .. show_quiz
      (all learning activities have 10-20 items, default 10. Honour an in-range requested count
      exactly. If the learner asks for fewer than 10 or more than 20, do not call
      a tool: briefly say the minimum is 10 and the maximum is 20, then ask them
      to choose a number in that range.)
      (asked again? vary: show_true_false for misconceptions, show_matching for
      pairs, show_ordering for sequences, show_fill_blank for key terms)
    - memorise, remember, flashcards, drill me ............... show_flashcards
      (10-20 cards, default 10)
    - sorting, categorizing, drag items into groups ......... show_sorting
    - word search, crossword, hangman, unscramble ............ show_word_game
    - flashcard speed round, timed flashcards ............... show_speed_flashcards
    - branching story, choices leading to outcomes .......... show_branching_story
    - simulation, role-play, decisions under constraints .... show_simulation
    - two truths and a lie, pick the false statement ........ show_two_truths_lie
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
    Quality gate before calling a tool: use only facts supported by the lesson.
    Every learning activity MUST contain 10-20 distinct items, default exactly 10.
    Counts mean questions, cards, pairs, sortable items, steps, blanks, statements,
    words or rounds as appropriate. In branching stories count decision nodes,
    not endings. Honour the exact requested count and never pad with duplicates.
    make every prompt distinct, give exactly one defensible correct answer where
    applicable, and make wrong choices plausible without being trick questions.
    Do not use a widget merely to decorate an answer. If the learner's request is
    ambiguous, ask one short clarifying question in plain text instead of guessing.
    A plain conceptual question ("what is X?", "why...?") gets plain text, no tool.
    Pick the ONE best tool (at most three for a request that clearly needs
    several). Write one or two sentences of text with the tool -- never repeat
    the tool's content in the text. The word limits above apply to your text,
    not to tool content. All generated learning activities are saved to the
    learner's Library automatically -- you may say so in one short clause.
    """


# A message that plainly asks for one format gets that tool FORCED (tool_choice):
# the fallback models often ignore the rules above and answer in prose. Order
# matters -- the first match wins, most specific first. A message matching none
# leaves the choice to the model.
_REQUESTS = [
    (r"\btwo truths (and|&) a lie\b", "show_two_truths_lie"),
    (r"\bbranching stor(y|ies)\b", "show_branching_story"),
    (r"\bsimulation\b|\brole[- ]play\b", "show_simulation"),
    (r"\bspeed round\b|\btimed flashcards\b", "show_speed_flashcards"),
    (r"\b(word search|crossword|hangman|unscramble)\b", "show_word_game"),
    (r"\b(sort(ing)?|categori[sz](e|ing|ation))\b", "show_sorting"),
    (r"\bmind ?maps?\b", "show_mindmap"),
    (r"\bmatch(ing)?\b|\bpair (them|each|up)\b", "show_matching"),
    (r"\b(in|into) (the right |correct )?order\b|\border (the|these)\b|\bsequence (the|these)\b", "show_ordering"),
    (r"\bfill[- ]?in[- ]?(the[- ])?blanks?\b|\bblanks?\b", "show_fill_blank"),
    (r"\b(true or false|true/false|myth or fact|myths?)\b", "show_true_false"),
    (r"\bflash ?cards?\b|\bmemori[sz]e\b|\bhelp me (remember|recall)\b|\bdrill me\b", "show_flashcards"),
    (r"\bwhat happens (to|if|when|as)\b|\bhow does .{2,60}\b(affect|change|grow|scale)\b|"
     r"\bas (the|i|n|it) .{0,40}\b(increase|grow|get|change|double)", "show_explorer"),
    (r"\b(diagram|draw|flowchart|visuali[sz]e)\b", "show_diagram"),
    (r"\b(compare|comparison|difference between|differences|vs\.?|versus)\b", "show_table"),
    (r"\b(real[- ]world|real[- ]life|everyday) examples?\b|\bexamples? of (where|when|how)\b|"
     r"\bwhere (are|is) .{2,60} used\b", "show_cards"),
    (r"\b(write|show) (me )?(the |some )?code\b|\bpseudo ?code\b|\b(python|java|sql|javascript) (code|function|program)\b",
     "show_code"),
    (r"\bformulas?\b|\bequations?\b|\bderive\b|\bderivation\b", "show_math"),
    (r"\bhow (do|can|would) (i|you|we) (calculate|compute|solve|find|work out|convert)\b|"
     r"\bstep[- ]by[- ]step\b|\bworked example\b|\bwalk me through\b", "show_steps"),
    (r"\b(quiz|practice|practise|test) me\b|\bpractice (problems|questions)\b|\b(give|make|generate|create) (me )?(a )?quiz\b|"
     r"\bquiz\b", "show_quiz"),
]
_COMPILED_REQUESTS = [(re.compile(pattern, re.IGNORECASE), tool) for pattern, tool in _REQUESTS]
_QUIZ_ITEM_COUNT = re.compile(r"\b(\d{1,3})\s*(?:quiz\s*)?(?:questions?|items?)\b", re.IGNORECASE)


def requested_tool(message: str) -> str | None:
    """The tool a learner's message plainly asks for, or None to let the model decide."""
    for pattern, tool in _COMPILED_REQUESTS:
        if pattern.search(message or ""):
            return tool
    return None


def requested_quiz_count(message: str) -> int | None:
    """The requested quiz size when the learner clearly asked for a quiz."""
    if requested_tool(message) != "show_quiz":
        return None
    match = _QUIZ_ITEM_COUNT.search(message or "")
    return int(match.group(1)) if match else None


ACTIVITY_TOOLS = {"show_quiz", "show_flashcards", "show_matching", "show_ordering", "show_fill_blank",
                  "show_true_false", "show_sorting", "show_word_game", "show_speed_flashcards",
                  "show_branching_story", "show_simulation", "show_two_truths_lie"}
_ACTIVITY_COUNT = re.compile(r"\b(\d{1,3})\s*[- ]?\s*(?:quiz\s*)?(?:questions?|items?|flashcards?|cards?|pairs?|terms?|words?|blanks?|statements?|claims?|rounds?|steps?|decision points?|decisions?)\b", re.IGNORECASE)


def requested_activity_count(message: str) -> int | None:
    if requested_tool(message) not in ACTIVITY_TOOLS:
        return None
    match = _ACTIVITY_COUNT.search(message or "")
    return int(match.group(1)) if match else MIN_ACTIVITY_ITEMS


def activity_token_budget(tool: str | None, count: int | None) -> int | None:
    if tool not in ACTIVITY_TOOLS or count is None:
        return None
    per_item = 500 if tool in ("show_branching_story", "show_simulation") else 250
    return min(12000, max(4000, count * per_item + 1500))


def activity_item_count(widget: dict) -> int | None:
    fields = {"quiz": "questions", "flashcards": "cards", "speed_flashcards": "cards", "matching": "pairs",
              "ordering": "items", "fill_blank": "blanks", "true_false": "claims", "word_game": "words",
              "simulation": "rounds", "two_truths_lie": "rounds"}
    kind = widget.get("type")
    if kind == "sorting":
        return sum(len(group["items"]) for group in widget["groups"])
    if kind == "branching_story":
        return sum(bool(node["choices"]) for node in widget["nodes"])
    return len(widget[fields[kind]]) if kind in fields else None


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


def _key(value: str) -> str:
    """A forgiving identity key used to reject repetitive model output."""
    return re.sub(r"\s+", " ", value).strip().casefold()


def _unique(items: list[dict], field: str) -> list[dict]:
    """Keep the first useful occurrence, preserving the model's intended order."""
    seen: set[str] = set()
    result = []
    for item in items:
        identity = _key(str(item.get(field, "")))
        if identity and identity not in seen:
            seen.add(identity)
            result.append(item)
    return result


def _quiz(args: dict) -> dict | None:
    questions = []
    for raw in _list(args, "questions", MAX_QUIZ_QUESTIONS):
        options = [o for o in (_text(o, 200) for o in (raw.get("options") or [])[:6]) if o]
        try:
            correct = int(raw.get("correct_index", raw.get("correctIndex", -1)))
        except (TypeError, ValueError):
            continue
        stem = _text(raw.get("question"), 500)
        option_keys = [_key(option) for option in options]
        if (not stem or len(options) < 2 or len(set(option_keys)) != len(options)
                or not 0 <= correct < len(options)):
            continue
        questions.append({"question": stem, "options": options, "correctIndex": correct,
                          "explanation": _text(raw.get("explanation"), 500)})
    questions = _unique(questions, "question")
    if len(questions) < MIN_QUIZ_QUESTIONS:
        return None
    return {"type": "quiz", "title": _text(args.get("title"), 120) or "Practice",
            "questions": questions, "hint": _text(args.get("hint"), 2000)}


def _table(args: dict) -> dict | None:
    columns = [column for column in (_text(c, 80) for c in (args.get("columns") or [])[:6]) if column]
    if len(columns) < 2 or len({_key(column) for column in columns}) != len(columns):
        return None
    rows = []
    for raw in (args.get("rows") or [])[:12]:
        if isinstance(raw, list):
            cells = [_text(c, 200) for c in raw][:len(columns)]
            row = cells + [""] * (len(columns) - len(cells))
            if any(row):
                rows.append(row)
    unique_rows: list[list[str]] = []
    seen_rows: set[tuple[str, ...]] = set()
    for row in rows:
        identity = tuple(_key(cell) for cell in row)
        if identity not in seen_rows:
            seen_rows.add(identity)
            unique_rows.append(row)
    rows = unique_rows
    if not rows:
        return None
    return {"type": "table", "columns": columns, "rows": rows, "caption": _text(args.get("caption"), 300)}


def _cards(args: dict) -> dict | None:
    cards = [{key: _text(r.get(key), 200) for key in ("title", "detail", "highlight", "icon")}
             for r in _list(args, "cards", 6)]
    cards = _unique([c for c in cards if c["title"]], "title")
    return {"type": "cards", "title": _text(args.get("title"), 120), "cards": cards} if len(cards) >= 2 else None


def _flashcards(args: dict) -> dict | None:
    cards = [{"front": _text(r.get("front"), 200), "back": _text(r.get("back"), 500)}
             for r in _list(args, "cards", MAX_ACTIVITY_ITEMS)]
    cards = _unique([c for c in cards if c["front"] and c["back"]], "front")
    return {"type": "flashcards", "title": _text(args.get("title"), 120), "cards": cards} if len(cards) >= 3 else None


def _steps(args: dict) -> dict | None:
    steps = [{"title": _text(r.get("title"), 120), "detail": _text(r.get("detail"), 800)}
             for r in _list(args, "steps", 8)]
    steps = _unique([st for st in steps if st["title"] or st["detail"]], "title")
    problem = _text(args.get("problem"), 500)
    if not problem or len(steps) < 2:
        return None
    return {"type": "steps", "problem": problem, "steps": steps, "answer": _text(args.get("answer"), 300)}


def _matching(args: dict) -> dict | None:
    pairs = [{"term": _text(r.get("term"), 120), "match": _text(r.get("match"), 200)}
             for r in _list(args, "pairs", MAX_ACTIVITY_ITEMS)]
    pairs = _unique([p for p in pairs if p["term"] and p["match"]], "term")
    if (len(pairs) < 3 or len({_key(p["match"]) for p in pairs}) < len(pairs)):
        return None
    return {"type": "matching", "title": _text(args.get("title"), 160), "pairs": pairs}


def _ordering(args: dict) -> dict | None:
    items = [i for i in (_text(i, 200) for i in (args.get("items") or [])[:MAX_ACTIVITY_ITEMS]) if i]
    if len(items) < 3 or len({_key(item) for item in items}) < len(items):
        return None
    return {"type": "ordering", "title": _text(args.get("title"), 160) or "Put these in order",
            "items": items, "explanation": _text(args.get("explanation"), 400)}


def _fill_blank(args: dict) -> dict | None:
    blanks = []
    for r in _list(args, "blanks", MAX_ACTIVITY_ITEMS):
        sentence, answer = _text(r.get("sentence"), 400), _text(r.get("answer"), 80)
        if sentence and answer and "___" in sentence:
            alts = [a for a in (_text(a, 80) for a in (r.get("alternatives") or [])) if a][:5]
            blanks.append({"sentence": sentence, "answer": answer, "alternatives": alts})
    blanks = _unique(blanks, "sentence")
    return {"type": "fill_blank", "title": _text(args.get("title"), 120), "blanks": blanks} if len(blanks) >= 2 else None


def _true_false(args: dict) -> dict | None:
    claims = []
    for r in _list(args, "claims", MAX_ACTIVITY_ITEMS):
        statement = _text(r.get("statement"), 300)
        value = r.get("is_true", r.get("isTrue"))
        if statement and isinstance(value, bool):
            claims.append({"statement": statement, "isTrue": value,
                           "explanation": _text(r.get("explanation"), 400)})
    claims = _unique(claims, "statement")
    if len(claims) < 3:
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
    steps = _unique([st for st in steps if st["latex"]], "latex")
    return {"type": "math", "title": _text(args.get("title"), 120), "steps": steps} if steps else None


def _diagram(args: dict) -> dict | None:
    source = re.sub(r"^```(?:mermaid)?\s*|\s*```$", "", str(args.get("mermaid") or "").strip())[:4000]
    # No click handlers or init directives: the source is model-written.
    allowed = ("flowchart", "graph", "sequencediagram", "classdiagram", "statediagram",
               "erdiagram", "journey", "gantt", "timeline", "mindmap")
    first = next((line.strip().casefold() for line in source.splitlines() if line.strip()), "")
    if (not source or re.search(r"\bclick\b|%%\{", source)
            or not any(first.startswith(kind) for kind in allowed)):
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
        step = abs(_number(r.get("step"), 1) or 1)
        variables.append({"name": name, "label": _text(r.get("label"), 80) or name, "min": low, "max": high,
                          "step": min(step, high - low), "value": value})
    outputs = [{"label": _text(r.get("label"), 80), "formula": _text(r.get("formula"), 300),
                "format": r.get("format") if r.get("format") in ("number", "percent", "binary") else "number"}
               for r in _list(args, "outputs", 5)]
    outputs = [o for o in outputs if o["label"] and o["formula"]]
    variables = _unique(variables, "name")
    outputs = _unique(outputs, "label")
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
                             "children": _unique([c for c in children if c["label"]], "label")})
    branches = _unique(branches, "label")
    if not center or len(branches) < 3:
        return None
    return {"type": "mindmap", "center": center, "branches": branches}


def _sorting(args: dict) -> dict | None:
    groups, seen = [], set()
    for group in _list(args, "groups", 4):
        name = _text(group.get("name"), 80)
        items = []
        for value in (group.get("items") or [])[:MAX_ACTIVITY_ITEMS]:
            text = _text(value, 160)
            if text and _key(text) not in seen and len(seen) < MAX_ACTIVITY_ITEMS:
                seen.add(_key(text))
                items.append(text)
        if name and items:
            groups.append({"name": name, "items": items})
    if len(groups) < 2 or len({_key(g["name"]) for g in groups}) != len(groups):
        return None
    return {"type": "sorting", "title": _text(args.get("title"), 120), "groups": groups,
            "explanation": _text(args.get("explanation"), 500)}


def _word_game(args: dict) -> dict | None:
    variant = args.get("variant")
    if variant not in ("word_search", "crossword", "hangman", "unscramble"):
        return None
    words = []
    for entry in _list(args, "words", MAX_ACTIVITY_ITEMS):
        word = re.sub(r"[^A-Z]", "", _text(entry.get("word"), 40).upper())
        clue = _text(entry.get("clue"), 240)
        if 3 <= len(word) <= 14 and clue:
            words.append({"word": word, "clue": clue})
    words = _unique(words, "word")
    return {"type": "word_game", "title": _text(args.get("title"), 120), "variant": variant, "words": words} if len(words) >= 2 else None


def _puzzle(args: dict) -> dict | None:
    variant = args.get("variant")
    labels = [_text(value, 36) for value in (args.get("labels") or [])[:9]]
    if variant not in ("jigsaw", "sliding") or len(labels) != 9 or not all(labels):
        return None
    return {"type": "puzzle", "variant": variant, "title": _text(args.get("title"), 120), "labels": labels,
            "explanation": _text(args.get("explanation"), 600)}


def _visual_game(args: dict) -> dict | None:
    variant = args.get("variant")
    if variant not in ("spot_difference", "hidden_objects"):
        return None
    objects, positions = [], set()
    for entry in _list(args, "objects", 12):
        position = entry.get("position")
        if isinstance(position, bool) or not isinstance(position, int) or not 0 <= position < 16 or position in positions:
            continue
        label, symbol = _text(entry.get("label"), 60), _text(entry.get("symbol"), 12)
        if not label or not symbol:
            continue
        positions.add(position)
        changed = _text(entry.get("changed_symbol"), 12)
        objects.append({"label": label, "symbol": symbol, "changedSymbol": changed if changed != symbol else "", "position": position})
    objects = _unique(objects, "label")
    labels = {obj["label"] for obj in objects}
    targets = list(dict.fromkeys(_text(value, 60) for value in (args.get("targets") or [])[:6] if _text(value, 60) in labels))
    if variant == "spot_difference":
        targets = [obj["label"] for obj in objects if obj["changedSymbol"]]
    if len(objects) < 4 or not targets:
        return None
    return {"type": "visual_game", "variant": variant, "title": _text(args.get("title"), 120), "objects": objects,
            "targets": targets, "explanation": _text(args.get("explanation"), 500)}


def _speed_flashcards(args: dict) -> dict | None:
    widget = _flashcards(args)
    if widget:
        widget["type"] = "speed_flashcards"
        widget["seconds"] = int(min(60, max(5, _number(args.get("seconds"), 15))))
    return widget


def _branching_story(args: dict) -> dict | None:
    nodes = []
    for entry in _list(args, "nodes", 60):
        node_id, text = _text(entry.get("id"), 40), _text(entry.get("text"), 900)
        choices = [{"text": _text(choice.get("text"), 200), "nextId": _text(choice.get("next_id"), 40),
                    "feedback": _text(choice.get("feedback"), 500)} for choice in _list(entry, "choices", 3)]
        if not node_id or not text or any(not choice["text"] or not choice["nextId"] for choice in choices):
            return None
        node = {"id": node_id, "text": text, "choices": choices}
        if not choices:
            outcome = _text(entry.get("outcome"), 10).lower()
            node["endingTitle"] = _text(entry.get("ending_title"), 80)
            node["outcome"] = outcome if outcome in ("best", "mixed", "poor") else ""
        nodes.append(node)
    by_id = {node["id"]: node for node in nodes}
    start = _text(args.get("start_id"), 40)
    if len(by_id) != len(nodes) or start not in by_id:
        return None
    visiting, visited, endings = set(), set(), set()

    def visit(node_id):
        if node_id not in by_id or node_id in visiting:
            return False
        if node_id in visited:
            return True
        visiting.add(node_id)
        node = by_id[node_id]
        if not node["choices"]:
            endings.add(node_id)
        elif len(node["choices"]) < 2 or not all(visit(choice["nextId"]) for choice in node["choices"]):
            return False
        visiting.remove(node_id)
        visited.add(node_id)
        return True

    if not visit(start) or len(endings) < 2:
        return None
    return {"type": "branching_story", "title": _text(args.get("title"), 120), "role": _text(args.get("role"), 200),
            "startId": start, "nodes": [node for node in nodes if node["id"] in visited],
            "concept": _text(args.get("concept"), 120), "takeaway": _text(args.get("takeaway"), 300)}


def _simulation(args: dict) -> dict | None:
    resources = []
    for entry in _list(args, "resources", 3):
        name = _text(entry.get("name"), 40)
        initial, minimum = _number(entry.get("initial")), _number(entry.get("minimum"), 0)
        if not name or initial is None or minimum is None or initial < minimum:
            return None
        resources.append({"name": name, "initial": initial, "minimum": minimum, "description": _text(entry.get("description"), 120)})
    names = {resource["name"] for resource in resources}
    target, threshold = _text(args.get("target_resource"), 40), _number(args.get("target_minimum"))
    if not resources or len(names) != len(resources) or target not in names or threshold is None:
        return None
    rounds = []
    for entry in _list(args, "rounds", MAX_ACTIVITY_ITEMS):
        situation = _text(entry.get("situation"), 700)
        choices = []
        for choice in _list(entry, "choices", 3):
            text = _text(choice.get("text"), 200)
            effects = []
            for effect in _list(choice, "effects", 3):
                name, delta = _text(effect.get("resource"), 40), _number(effect.get("delta"))
                if name not in names or delta is None:
                    return None
                effects.append({"resource": name, "delta": delta})
            if not text:
                return None
            choices.append({"text": text, "effects": effects, "feedback": _text(choice.get("feedback"), 600)})
        if not situation or len(choices) < 2:
            return None
        rounds.append({"situation": situation, "choices": choices})
    if len(rounds) < 2:
        return None
    # Bounded memoized search avoids enumerating 3**20 paths for a 20-round set.
    visited, remaining_budget = set(), [10000]
    optimistic = [0.0] * (len(rounds) + 1)
    for index in range(len(rounds) - 1, -1, -1):
        optimistic[index] = optimistic[index + 1] + max(sum(effect["delta"] for effect in choice["effects"] if effect["resource"] == target) for choice in rounds[index]["choices"])

    def achievable(index, state):
        if index == len(rounds):
            return state[target] >= threshold
        if state[target] + optimistic[index] < threshold or remaining_budget[0] <= 0:
            return False
        key = (index, tuple(round(state[resource["name"]], 6) for resource in resources))
        if key in visited:
            return False
        visited.add(key)
        remaining_budget[0] -= 1
        for choice in rounds[index]["choices"]:
            next_state = dict(state)
            for effect in choice["effects"]:
                next_state[effect["resource"]] += effect["delta"]
            if all(next_state[resource["name"]] >= resource["minimum"] for resource in resources) and achievable(index + 1, next_state):
                return True
        return False

    if not achievable(0, {resource["name"]: resource["initial"] for resource in resources}):
        return None
    return {"type": "simulation", "title": _text(args.get("title"), 120), "role": _text(args.get("role"), 200),
            "goal": _text(args.get("goal"), 300), "resources": resources, "targetResource": target,
            "targetMinimum": threshold, "rounds": rounds, "concept": _text(args.get("concept"), 120),
            "takeaway": _text(args.get("takeaway"), 300)}


def _two_truths_lie(args: dict) -> dict | None:
    rounds = []
    for entry in _list(args, "rounds", MAX_ACTIVITY_ITEMS):
        statements = [_text(statement, 300) for statement in (entry.get("statements") or [])[:3]]
        false_index = entry.get("false_index")
        if (len(statements) != 3 or not all(statements) or len({_key(statement) for statement in statements}) != 3
                or isinstance(false_index, bool) or not isinstance(false_index, int) or false_index not in (0, 1, 2)):
            return None
        rounds.append({"statements": statements, "falseIndex": false_index, "explanation": _text(entry.get("explanation"), 600)})
    return {"type": "two_truths_lie", "title": _text(args.get("title"), 120), "rounds": rounds} if len(rounds) >= 2 else None


_BUILDERS = {
    "show_branching_story": _branching_story, "show_simulation": _simulation, "show_two_truths_lie": _two_truths_lie,
    "show_sorting": _sorting, "show_word_game": _word_game, "show_puzzle": _puzzle,
    "show_visual_game": _visual_game, "show_speed_flashcards": _speed_flashcards,
    "show_mindmap": _mindmap,
    "show_quiz": _quiz, "show_table": _table, "show_cards": _cards, "show_flashcards": _flashcards,
    "show_steps": _steps, "show_matching": _matching, "show_ordering": _ordering,
    "show_fill_blank": _fill_blank, "show_true_false": _true_false, "show_code": _code,
    "show_math": _math, "show_diagram": _diagram, "show_explorer": _explorer,
}


def normalize(name: str, args: Any, expected_count: int | None = None) -> dict | None:
    """The widget a tool call describes, or None when it is unusable."""
    builder = _BUILDERS.get(name)
    if builder is None or not isinstance(args, dict):
        return None
    widget = builder(args)
    if widget is None:
        return None
    count = activity_item_count(widget)
    if count is not None and (not MIN_ACTIVITY_ITEMS <= count <= MAX_ACTIVITY_ITEMS or (expected_count is not None and count != expected_count)):
        return None
    return widget


def _describe_one(w: dict) -> str:
    kind = w["type"]
    if kind in ("sorting", "word_game", "puzzle", "visual_game", "speed_flashcards", "branching_story", "simulation", "two_truths_lie"):
        return f"[Learning activity shown: {kind} -- {w.get('title', '')}]"
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
