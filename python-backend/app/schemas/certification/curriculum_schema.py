"""Curriculum blueprint returned by the curriculum planning agent.

This model used to be a *provider-side* contract: Groq parsed and validated
the planner's tool-call arguments before returning them and answered HTTP 400
`tool_use_failed` on any mismatch, so no validator here could rescue a payload
the provider had already rejected. It no longer is -- the planner answers in
plain JSON (see `app.agents.certification.curriculum_agent`) and everything
below finally runs on every sample. Keep the tolerance anyway: it is what
turns the model's habitual mistakes into a curriculum instead of a retry.

The history is worth keeping, because it is one lesson learned three times:

1. A bare string where a list was expected (`"certification_focus": "TOPCIT"`)
   -- answered by making the schema accept both (`StrList`).
2. A required `status` the model had no way to reason about, which it kept
   placing inside `curriculum` instead of beside it -- answered by dropping
   the wrapper entirely (see below).
3. Major categories nested inside another major's `middleCategories`, and
   middle categories nested inside a `lessons` array -- answered by making
   the containers optional and hoisting the branch back out (`_hoist_majors`,
   `_hoist_middles`).

Each of those made the schema *more tolerant* of a payload the model still
could not produce. The fourth failure -- five straight `tool_use_failed`
attempts on TOPCIT, one with outright unbalanced JSON -- was not a tolerance
problem at all. Asking for a 12-field `lessonGenerationInstructions` object
per lesson, six levels deep, across the 18-120 lessons the prompt requires,
is tens of thousands of tokens of nested repetition; the model loses
bracket-tracking partway through and the provider rejects the whole call.

So the planner now emits an *outline*: name, objective, and a flat list of
key topics per lesson. That is roughly a twentieth of the output for the same
syllabus, which is also what finally lets a sample clear `_require_breadth`.
The detailed lesson plan was only ever interpolated into the lesson-writing
prompt (`app.ai.prompts.certification.build_lesson_prompt`), and the lesson
agent's own system prompt already specifies the structure it produces -- so
nothing downstream lost information it was actually using.
"""

import logging
import math
from itertools import zip_longest
from typing import Annotated, Any, List

from pydantic import BaseModel, BeforeValidator, WithJsonSchema, model_validator

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _coerce_str_list(value: Any) -> Any:
    """Normalises a single string to a one-element list, leaving anything
    else for pydantic to validate or reject as usual."""
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    return value


StrList = Annotated[
    List[str],
    BeforeValidator(_coerce_str_list),
    WithJsonSchema(
        {
            "anyOf": [
                {"type": "array", "items": {"type": "string"}},
                {"type": "string"},
            ]
        }
    ),
]


class ExamSection(BaseModel):
    """One part of the real exam -- FE's Subject A, IT Passport's Strategy
    field -- stored in `certification_exam_sections`."""

    name: str = ""
    total_items: int = 0
    duration_minutes: int = 0
    question_types: StrList = []


class ExamStructure(BaseModel):
    """What the real certification exam looks like.

    Planned once, at the root, because the mock exam has to *imitate* a
    specific exam rather than sample the syllabus generically: TOPCIT mixes
    MCQ, short-answer, descriptive, programming and diagramming and has its own
    item count, while other certifications are MCQ-only. Without this the mock
    exam was built from the curriculum outline alone and had no way to know
    either fact.

    Every field is optional and cheap -- one flat object for the whole
    curriculum, not per lesson -- so it cannot reintroduce the payload size
    that made the planner's tool call fail.
    """

    total_items: int = 0
    question_types: StrList = []

    duration_minutes: int = 0

    passing_score: float = 0.0

    coverage: str = ""

    notes: str = ""

    sections: List[ExamSection] = []

    source: str = ""


class Lesson(BaseModel):
    name: str
    learning_objective: str = ""
    key_topics: StrList = []


class MiddleCategory(BaseModel):
    name: str
    description: str = ""
    lessons: List[Lesson] = []


class MajorCategory(BaseModel):
    name: str
    description: str = ""
    middleCategories: List[MiddleCategory] = []


def _is_lesson(node: Any) -> bool:
    """True for a node that is a lesson and not a mis-nested container.

    Since the planner stopped emitting `lessonGenerationInstructions`, the tell
    is negative: a lesson is a named node carrying no children of its own.
    """
    return (
        isinstance(node, dict)
        and bool(node.get("name"))
        and not node.get("lessons")
        and not node.get("middleCategories")
    )


def _is_misnested_middle(node: Any) -> bool:
    """True for a would-be lesson that is really a middle category.

    Structural tell: it carries its own `lessons`. This is the same mistake as
    `_is_misnested_major` one level down -- the model flattens a level of the
    hierarchy and keeps going -- and it arrived the same way, as a
    `tool_use_failed` 400 with four sibling lessons and two middle categories
    all sitting in one `lessons` array.
    """
    return isinstance(node, dict) and isinstance(node.get("lessons"), list) and bool(node["lessons"])


def _hoist_middles(middle: dict) -> List[dict]:
    """Returns `middle` plus every middle category wrongly nested in its
    `lessons`. Recursive, since a hoisted one can repeat the mistake."""
    lessons: List[Any] = []
    hoisted: List[dict] = []

    for child in middle.get("lessons") or []:
        if _is_misnested_middle(child):
            hoisted.extend(_hoist_middles(child))
        elif _is_lesson(child):
            lessons.append(child)

    repaired = {**middle, "lessons": lessons}
    return [repaired, *hoisted] if lessons else hoisted


def _is_misnested_major(node: Any) -> bool:
    """True for a would-be middle category that is really a major one.

    The tell is structural rather than semantic: it carries child categories
    where a middle category carries lessons.
    """
    return (
        isinstance(node, dict)
        and isinstance(node.get("middleCategories"), list)
        and bool(node["middleCategories"])
        and not node.get("lessons")
    )


def _hoist_majors(node: dict) -> List[dict]:
    """Returns `node` plus every major category wrongly nested beneath it.

    Recursive because the model has no reason to stop at one level: a hoisted
    branch can itself contain the same mistake.
    """
    middles: List[Any] = []
    hoisted: List[dict] = []

    for child in node.get("middleCategories") or []:
        if _is_misnested_major(child):
            hoisted.extend(_hoist_majors(child))
        elif isinstance(child, dict) and child.get("lessons"):
            middles.extend(_hoist_middles(child))

    repaired = {**node, "middleCategories": middles}
    return [repaired, *hoisted] if middles else hoisted


_MAJOR_FLOOR_RATIO = 0.6
_LESSON_FLOOR_RATIO = 0.33


def required_major_categories() -> int:
    if get_settings().curriculum_autosize:
        return 1
    return max(1, math.ceil(get_settings().curriculum_min_majors * _MAJOR_FLOOR_RATIO))


def required_total_lessons() -> int:
    settings = get_settings()
    if settings.curriculum_autosize:
        return 1
    smallest_ask = (
        settings.curriculum_min_majors
        * settings.curriculum_min_middles
        * settings.curriculum_min_lessons
    )
    return max(1, math.ceil(smallest_ask * _LESSON_FLOOR_RATIO))


def _allocate_lessons(asked: dict, cap: int) -> dict:
    """Share `cap` lessons out across the middle categories in `asked`.

    A floor of one lesson each so no category disappears, then the surplus in
    proportion to what the planner actually asked for, largest-remainder so the
    parts sum to the cap exactly rather than drifting under it.
    """
    keys = list(asked)

    if len(keys) > cap:
        by_major: dict = {}
        for key in keys:
            by_major.setdefault(key[0], []).append(key)
        ordered = [
            key
            for row in zip_longest(*by_major.values())
            for key in row
            if key is not None
        ]
        return {key: 1 for key in ordered[:cap]}

    keep = {key: 1 for key in keys}
    budget = cap - len(keys)
    surplus = sum(len(asked[key]) - 1 for key in keys)
    if budget <= 0 or surplus <= 0:
        return keep

    remainders = []
    for key in keys:
        exact = (len(asked[key]) - 1) * budget / surplus
        whole = int(exact)
        keep[key] += whole
        remainders.append((exact - whole, key))

    def _fair_order(entry):
        remainder, (major_index, middle_index) = entry
        return (-remainder, middle_index, major_index)

    for _, key in sorted(remainders, key=_fair_order):
        if sum(keep.values()) >= cap:
            break
        if keep[key] < len(asked[key]):
            keep[key] += 1
    return keep


def _enforce_total_lesson_backstop(majors: List[Any]) -> List[Any]:
    """Caps the TOTAL lesson count under `curriculum_autosize`.

    Not a size knob -- a circuit breaker. Autosize deliberately lets the
    planner decide the shape, which means nothing else bounds how much work the
    build stage is about to be handed. An unbounded plan is what drained the
    account on 2026-08-24 (see `_enforce_ceiling`), and per-lesson cost rises
    as a run goes on, so the tail of a very long plan is also its most
    expensive part.

    Trims PROPORTIONALLY, not off the end. Filling the budget in plan order and
    stopping bounded the cost correctly but cut on the wrong axis: it amputated
    whole Major Categories rather than shortening anything. The first TOPCIT
    plan was 5 majors / 73 lessons, so against a cap of 60 the last domain
    would have gone entirely and the certification would have shipped covering
    four of five -- looking complete the whole time. Shortening every branch
    instead spends the trim on depth, which a lesson can absorb by carrying
    more key_topics, rather than on breadth, which nothing downstream can
    recover.

    Set `curriculum_autosize_max_lessons` to 0 to remove the cap.
    """
    cap = get_settings().curriculum_autosize_max_lessons
    if cap <= 0:
        return majors

    asked: dict = {}
    for major_index, major in enumerate(majors):
        if not isinstance(major, dict):
            continue
        for middle_index, mid in enumerate(major.get("middleCategories") or []):
            if isinstance(mid, dict) and (mid.get("lessons") or []):
                asked[(major_index, middle_index)] = mid["lessons"]

    total = sum(len(lessons) for lessons in asked.values())
    if not asked or total <= cap:
        return majors

    keep = _allocate_lessons(asked, cap)

    trimmed: List[Any] = []
    for major_index, major in enumerate(majors):
        if not isinstance(major, dict):
            trimmed.append(major)
            continue
        middles: List[Any] = []
        for middle_index, mid in enumerate(major.get("middleCategories") or []):
            if not isinstance(mid, dict):
                middles.append(mid)
                continue
            key = (major_index, middle_index)
            if key not in asked:
                continue
            allowed = keep.get(key, 0)
            if allowed > 0:
                middles.append({**mid, "lessons": asked[key][:allowed]})
        if middles:
            trimmed.append({**major, "middleCategories": middles})

    logger.warning(
        "Autosized curriculum exceeded the %d-lesson backstop -- the planner "
        "asked for %d across %d middle categories -- and was trimmed "
        "proportionally. Every category is still represented but each is "
        "shallower than planned, so reshape the plan (or raise "
        "curriculum_autosize_max_lessons) rather than assuming it is intact.",
        cap,
        total,
        len(asked),
    )
    return trimmed


def _enforce_ceiling(majors: List[Any]) -> List[Any]:
    """Trims a plan down to `curriculum_max_*`.

    The max settings were only ever interpolated into the planner's prompt
    (`agents.certification.curriculum_agent`) and never checked against what
    came back, so they were a request the model was free to ignore -- and did.
    A run configured for 2 major categories returned 5 majors / 25 middles /
    125 lessons on 2026-08-24, reached lesson 77, and died on a 402 with the
    account balance exhausted having persisted nothing. The knob read like a
    budget control and was not one.

    Truncated rather than rejected, for the same reason the SHORT_ANSWER
    reclassification repairs instead of raising: a ValueError here is treated
    as malformed output and resamples the whole curriculum, which costs another
    planning call to fix something that is not a quality problem. The plan is
    good, there is simply more of it than was asked for -- and the caller who
    set the cap wants the smaller run, not a retry loop. Truncation is free and
    always succeeds.

    Order is preserved, so what survives is the planner's own leading material,
    which it writes most-fundamental-first.
    """
    settings = get_settings()

    if settings.curriculum_autosize:
        return _enforce_total_lesson_backstop(majors)

    max_majors = settings.curriculum_max_majors
    max_middles = settings.curriculum_max_middles
    max_lessons = settings.curriculum_max_lessons

    def _count(nodes: List[Any]) -> tuple[int, int, int]:
        mids = [
            mid
            for major in nodes
            if isinstance(major, dict)
            for mid in (major.get("middleCategories") or [])
            if isinstance(mid, dict)
        ]
        lessons = sum(len(mid.get("lessons") or []) for mid in mids)
        return len(nodes), len(mids), lessons

    before = _count(majors)

    trimmed: List[Any] = []
    for major in majors[:max_majors]:
        if not isinstance(major, dict):
            trimmed.append(major)
            continue
        middles = [
            {**mid, "lessons": (mid.get("lessons") or [])[:max_lessons]}
            if isinstance(mid, dict)
            else mid
            for mid in (major.get("middleCategories") or [])[:max_middles]
        ]
        trimmed.append({**major, "middleCategories": middles})

    after = _count(trimmed)
    if before != after:
        logger.warning(
            "Curriculum exceeded the configured ceiling and was trimmed: "
            "%d majors/%d middles/%d lessons -> %d/%d/%d "
            "(caps: %d/%d/%d). The planner does not honour the ask on its own.",
            *before, *after, max_majors, max_middles, max_lessons,
        )
    return trimmed


def _require_breadth(majors: List[Any]) -> None:
    lessons = sum(
        len(middle.get("lessons") or [])
        for major in majors
        if isinstance(major, dict)
        for middle in (major.get("middleCategories") or [])
        if isinstance(middle, dict)
    )
    min_majors = required_major_categories()
    min_lessons = required_total_lessons()
    if len(majors) < min_majors or lessons < min_lessons:
        raise ValueError(
            f"Curriculum is too small to be a syllabus: {len(majors)} major "
            f"category/ies and {lessons} lesson(s); at least "
            f"{min_majors} and {min_lessons} are required."
        )


def _hoist_exam_structure(root: dict, majors: List[Any]) -> dict:
    """Lifts an `exam_structure` the model wrote inside a major category.

    It is the last thing the prompt asks for and the last thing the model
    writes, so it lands one level too deep -- inside whichever major category
    it happened to be finishing. Left there it is dropped as an unknown field
    and the mock exam falls back to a generic MCQ paper, silently losing the
    one fact that makes it imitate the real exam.

    A correctly-placed root value always wins; only the first stray copy is
    adopted, since a second is the same object repeated.
    """
    if isinstance(root.get("exam_structure"), dict):
        return root

    for major in majors:
        if not isinstance(major, dict):
            continue
        structure = major.get("exam_structure")
        if isinstance(structure, dict):
            return {**root, "exam_structure": structure}

    return root


class Curriculum(BaseModel):
    """The planner's entire output.

    Deliberately the root: it used to sit inside a `CertificationCurriculum`
    wrapper carrying `certification_name` (an echo of the prompt) and `status`
    (workflow state the graph tracks itself). Both were fields the model had to
    place and nothing downstream read, and `status` in particular was misplaced
    inside `curriculum` in three of the four samples in the run that prompted
    this. Two fewer levels of nesting is also two fewer levels to lose track of.
    """

    majorCategories: List[MajorCategory]
    exam_structure: ExamStructure = ExamStructure()

    @model_validator(mode="before")
    @classmethod
    def _repair_hierarchy(cls, value: Any) -> Any:
        """Flattens the model's most frequent structural mistakes.

        Runs `before` so it sees the raw arguments -- by the time pydantic has
        built `MajorCategory` objects the mis-nested branch has already been
        discarded as an unknown field.
        """
        if not isinstance(value, dict):
            return value
        majors = value.get("majorCategories")
        if not isinstance(majors, list):
            return value

        value = _hoist_exam_structure(value, majors)

        repaired: List[Any] = []
        for major in majors:
            if isinstance(major, dict):
                repaired.extend(_hoist_majors(major))
            else:
                repaired.append(major)

        if majors and not repaired:
            raise ValueError("Curriculum contains no lessons.")

        if majors:
            repaired = _enforce_ceiling(repaired)
            _require_breadth(repaired)

        return {**value, "majorCategories": repaired}
