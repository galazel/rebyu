import ast
import logging
import re
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.diagrams.validation import check_reference

logger = logging.getLogger(__name__)

QuestionType = Literal["MCQ", "SHORT_ANSWER", "DESCRIPTIVE", "PROGRAMMING", "DIAGRAM"]
Difficulty = Literal["EASY", "AVERAGE", "HARD"]

DIFFICULTY_ALIASES = {"DIFFICULT": "HARD"}

BloomLevel = Literal["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]

BLOOM_ORDER: tuple[str, ...] = (
    "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE",
)

MCQ_CHOICE_COUNT = 4

MCQ_MIN_CHOICES = 3
MCQ_MAX_CHOICES = 9

MIN_EXPLANATION_CHARS = 20

MIN_PROGRAMMING_TEST_CASES = 3

DIAGRAM_TYPES: tuple[str, ...] = (
    "ACTIVITY_DIAGRAM",
    "UML_CLASS",
    "UML_COMPONENT",
    "ERD",
    "FLOWCHART",
    "SEQUENCE_DIAGRAM",
    "USE_CASE",
)

_DIAGRAM_TYPE_ALIASES = {
    "activity": "ACTIVITY_DIAGRAM",
    "activitydiagram": "ACTIVITY_DIAGRAM",
    "umlactivity": "ACTIVITY_DIAGRAM",
    "umlactivitydiagram": "ACTIVITY_DIAGRAM",
    "class": "UML_CLASS",
    "classdiagram": "UML_CLASS",
    "umlclass": "UML_CLASS",
    "umlclassdiagram": "UML_CLASS",
    "component": "UML_COMPONENT",
    "componentdiagram": "UML_COMPONENT",
    "umlcomponent": "UML_COMPONENT",
    "umlcomponentdiagram": "UML_COMPONENT",
    "er": "ERD",
    "erd": "ERD",
    "erdiagram": "ERD",
    "entityrelationship": "ERD",
    "entityrelationshipdiagram": "ERD",
    "flow": "FLOWCHART",
    "flowchart": "FLOWCHART",
    "flowdiagram": "FLOWCHART",
    "processflowchart": "FLOWCHART",
    "sequence": "SEQUENCE_DIAGRAM",
    "sequencediagram": "SEQUENCE_DIAGRAM",
    "umlsequence": "SEQUENCE_DIAGRAM",
    "umlsequencediagram": "SEQUENCE_DIAGRAM",
    "usecase": "USE_CASE",
    "usecasediagram": "USE_CASE",
    "umlusecase": "USE_CASE",
    "umlusecasediagram": "USE_CASE",
}


def normalize_diagram_type(value: str | None) -> str | None:
    """Maps whatever was written onto one of `DIAGRAM_TYPES`, or None.

    None means "not a diagram type this product can present", which the
    validator turns into a rejection so the model is asked again -- rather
    than storing a type the playground cannot equip and the learner meets as
    the wrong set of shapes.
    """
    key = "".join(ch for ch in (value or "").lower() if ch.isalnum())
    if not key:
        return None
    canonical = key.upper()
    if canonical in DIAGRAM_TYPES:
        return canonical
    stripped = {"".join(c for c in t.lower() if c.isalnum()): t for t in DIAGRAM_TYPES}
    if key in stripped:
        return stripped[key]
    return _DIAGRAM_TYPE_ALIASES.get(key)


MIN_CHOICE_EXPLANATION_CHARS = 15

_OPEN_ENDED_PHRASES = (
    "importance of",
    "significance of",
    "benefits of",
    "advantages and disadvantages",
    "why is",
    "why are",
    "why do",
    "in your own words",
    "what do you think",
    "how would you",
    "what are the implications",
)

_OPEN_ENDED_DIRECTIVES = (
    "discuss",
    "explain",
    "describe",
    "elaborate",
    "justify",
    "compare",
    "contrast",
)

_OPEN_ENDED_DIRECTIVE_PATTERN = re.compile(
    r"(?:^|[.;:,?!]\s*|\b(?:and|then|also|now|briefly|please)\s+)"
    r"(" + "|".join(_OPEN_ENDED_DIRECTIVES) + r")\b"
)

_ENUMERATION_STEMS = (
    "what are the",
    "which are the",
    "name the",
    "list the",
    "list three",
    "list four",
    "list five",
    "enumerate",
    "state the",
    "identify the",
    "give the",
    "what steps",
    "what phases",
    "what stages",
)

_COUNTED_UNIT_NOUNS = (
    "years", "months", "weeks", "days", "hours", "minutes", "seconds",
    "decades", "times", "bytes", "bits", "digits", "characters", "percent", "points", "marks",
)

_COUNTED_SET_PATTERN = re.compile(
    r"\b(?:two|three|four|five|six|seven|eight|nine|ten|[2-9]|10)\s+"
    r"(?!(?:" + "|".join(_COUNTED_UNIT_NOUNS) + r")\b)\w+s\b"
)

SHORT_ANSWER_MAX_WORDS = 6


class ProgrammingTestCase(BaseModel):
    input_data: str
    expected_output: str = ""


def _calls(code: str, name: str) -> bool:
    """Whether `code` parses as Python and calls `name` somewhere."""
    try:
        tree = ast.parse((code or "").strip())
    except SyntaxError:
        return False
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name) and func.id == name:
                return True
            if isinstance(func, ast.Attribute) and func.attr == name:
                return True
    return False


class SubQuestionDraft(BaseModel):
    """One part of a critical-thinking question.

    A PROGRAMMING or DIAGRAM item is a scenario a learner works through, and
    the parts are the questions asked *about* that scenario -- explain the
    trade-off, justify the cardinality, describe what breaks under load. The
    product has always modelled them (`subQuestions` in the question editor,
    `parent_question_id` in the schema, and a grader that marks the whole set
    in one holistic call) and the generator had no field to put them in, so
    every generated critical-thinking item arrived as a bare prompt with no
    parts. That is the whole difference between a workspace task and a
    question with a big text box.

    Written answers, always: the part is reasoning about the artifact, not a
    second artifact. `rubric_answer` is what the AI grader marks against.
    """

    question: str
    rubric_answer: str = ""
    points: float = 1.0


class QuestionDraft(BaseModel):
    """One generated question.

    The per-type rules below were previously stated *only* in the agent's
    system prompt (`question_agent.SYSTEM_PROMPT`) -- i.e. they were requests,
    not constraints, and a model that ignored them produced a structurally
    broken question that flowed straight through to an admin. They are now
    enforced here, so a violation raises and the shared retry policy asks the
    model again.
    """

    question_type: QuestionType
    question: str
    difficulty: Difficulty = "AVERAGE"
    explanation: str = ""

    @field_validator("difficulty", mode="before")
    @classmethod
    def _normalise_difficulty(cls, value: object) -> object:
        """Upper-cases and maps known synonyms onto the canonical vocabulary."""
        if not isinstance(value, str):
            return value
        upper = value.strip().upper()
        return DIFFICULTY_ALIASES.get(upper, upper)

    bloom_level: BloomLevel = "UNDERSTAND"
    learning_objective: str = ""
    lesson_ref: Optional[str] = None
    category_ref: Optional[str] = None
    estimated_seconds: int = 60
    source_chunk_ids: List[str] = Field(default_factory=list)

    choices: List[str] = Field(default_factory=list)
    correct_choice_index: Optional[int] = None
    choice_explanations: List[str] = Field(default_factory=list)

    correct_answer: Optional[str] = None
    accepted_variations: List[str] = Field(default_factory=list)

    rubric_answer: Optional[str] = None

    starter_code: Optional[str] = None
    test_cases: List[ProgrammingTestCase] = Field(default_factory=list)
    function_name: Optional[str] = None
    programming_language: Optional[str] = None
    rules: Optional[str] = None
    reference_solution: Optional[str] = None

    diagram_type: Optional[str] = None
    instructions: Optional[str] = None

    reference_diagram_xml: Optional[str] = None

    sub_questions: List[SubQuestionDraft] = Field(default_factory=list)

    @model_validator(mode="after")
    def _reclassify_open_ended_short_answers(self) -> "QuestionDraft":
        """Turns an open-ended SHORT_ANSWER into the DESCRIPTIVE it really is.

        Repaired rather than rejected on purpose. Raising here would resample
        the whole batch, and the model reproduces this mistake reliably enough
        that a strict rule could burn a run's entire token budget without ever
        producing an acceptable sample -- for a question whose *content* is
        perfectly good and only whose type is wrong. Reclassifying keeps the
        question and makes it gradeable.

        Runs before the shape checks below so the reclassified question is then
        validated as the DESCRIPTIVE it has become.
        """
        if self.question_type != "SHORT_ANSWER":
            return self

        stem = self.question.strip().lower()
        matched = next((phrase for phrase in _OPEN_ENDED_PHRASES if phrase in stem), None)
        if matched is None:
            directive = _OPEN_ENDED_DIRECTIVE_PATTERN.search(stem)
            matched = directive.group(1) if directive else None
        enumeration = next(
            (phrase for phrase in _ENUMERATION_STEMS if phrase in stem), None
        )
        counted = None
        if enumeration is None:
            counted_match = _COUNTED_SET_PATTERN.search(stem)
            counted = counted_match.group(0) if counted_match else None
        too_long = len((self.correct_answer or "").split()) > SHORT_ANSWER_MAX_WORDS

        if matched is None and enumeration is None and counted is None and not too_long:
            return self

        if matched:
            reason = f"the stem asks an open-ended question ({matched!r})"
        elif enumeration:
            reason = (
                f"the stem asks for a set of things ({enumeration!r}), which has no "
                "single canonical spelling to match against"
            )
        elif counted:
            reason = (
                f"the stem asks for a counted set ({counted!r}), which has no single "
                "canonical spelling to match against"
            )
        else:
            reason = (
                f"its answer is longer than {SHORT_ANSWER_MAX_WORDS} words, so no exact "
                "match is possible"
            )
        logger.info(
            "Reclassifying SHORT_ANSWER as DESCRIPTIVE -- %s: %.80s", reason, self.question
        )

        self.question_type = "DESCRIPTIVE"
        self.accepted_variations = []
        if not (self.rubric_answer or "").strip():
            self.rubric_answer = (self.correct_answer or "").strip() or (
                "A correct answer explains the concept the question asks about, "
                "grounded in the lesson content."
            )
        self.correct_answer = None
        return self

    @model_validator(mode="after")
    def _enforce_type_specific_shape(self) -> "QuestionDraft":
        if not self.question.strip():
            raise ValueError("question text must not be empty")

        if self.question_type == "MCQ":
            if not MCQ_MIN_CHOICES <= len(self.choices) <= MCQ_MAX_CHOICES:
                raise ValueError(
                    f"MCQ must have between {MCQ_MIN_CHOICES} and {MCQ_MAX_CHOICES} "
                    f"choices, got {len(self.choices)}"
                )
            if self.correct_choice_index is None:
                raise ValueError("MCQ must set correct_choice_index")
            if not 0 <= self.correct_choice_index < len(self.choices):
                raise ValueError(
                    f"correct_choice_index {self.correct_choice_index} is out of range"
                )
            if len({choice.strip().lower() for choice in self.choices}) != len(self.choices):
                raise ValueError("MCQ choices must be distinct")

        elif self.question_type == "SHORT_ANSWER":
            if not (self.correct_answer or "").strip():
                raise ValueError("SHORT_ANSWER must set correct_answer")
            key = " ".join(self.correct_answer.split()).lower()
            cleaned: list[str] = []
            for variation in self.accepted_variations:
                text = " ".join(str(variation or "").split()).lower()
                if text and text != key and text not in cleaned:
                    cleaned.append(text)
            self.accepted_variations = cleaned

        elif self.question_type == "DESCRIPTIVE":
            if not (self.rubric_answer or "").strip():
                raise ValueError("DESCRIPTIVE must set rubric_answer")

        elif self.question_type == "PROGRAMMING":
            if len(self.test_cases) < MIN_PROGRAMMING_TEST_CASES:
                raise ValueError(
                    f"PROGRAMMING must include at least {MIN_PROGRAMMING_TEST_CASES} "
                    f"test cases covering the ordinary case and its edges"
                )
            lang = (self.programming_language or "").strip().upper()
            if not lang:
                raise ValueError("PROGRAMMING must set programming_language")
            supported = {"C", "C++", "JAVA", "JAVASCRIPT", "PYTHON", "C#"}
            if lang not in supported:
                raise ValueError(
                    f"programming_language '{lang}' is not supported; use one of: "
                    + ", ".join(sorted(supported))
                )
            self.programming_language = lang

            name = (self.function_name or "").strip()
            if not name:
                raise ValueError("PROGRAMMING must set function_name")
            if not (self.rules or "").strip():
                raise ValueError(
                    "PROGRAMMING must set rules: the signature and every exact return "
                    "format, message, rounding and ordering the tests depend on"
                )
            if name not in f"{self.question} {self.rules}":
                raise ValueError(f"the question or its rules must name {name}")
            solution = (self.reference_solution or "").strip()
            if not solution:
                raise ValueError(
                    "PROGRAMMING must include reference_solution: a correct "
                    "solution the tests are run against"
                )
            if lang == "PYTHON":
                if not name.isidentifier():
                    raise ValueError(
                        "PROGRAMMING (Python) function_name must be a valid identifier"
                    )
                try:
                    ast.parse(solution)
                except SyntaxError as error:
                    raise ValueError(f"reference_solution is not valid Python: {error}") from error
                for index, case in enumerate(self.test_cases, 1):
                    if not _calls(case.input_data, name):
                        raise ValueError(
                            f"test case {index} must be Python code that calls {name}(...), "
                            "such as a single call or a few statements ending in one; "
                            "prose descriptions and bare data cannot be run"
                        )

        elif self.question_type == "DIAGRAM":
            if not (self.diagram_type or "").strip():
                raise ValueError("DIAGRAM must set diagram_type")
            canonical = normalize_diagram_type(self.diagram_type)
            if canonical is None:
                raise ValueError(
                    f"diagram_type '{self.diagram_type}' is not supported; use one of: "
                    + ", ".join(DIAGRAM_TYPES)
                )
            self.diagram_type = canonical
            if not (self.instructions or "").strip():
                raise ValueError("DIAGRAM must set instructions")

            reference = (self.reference_diagram_xml or "").strip()
            if reference and not check_reference(reference).ok:
                self.reference_diagram_xml = None

        if self.estimated_seconds <= 0:
            raise ValueError("estimated_seconds must be positive")

        return self

    @model_validator(mode="after")
    def _require_an_explanation(self) -> "QuestionDraft":
        """Every question must explain itself.

        This is what a learner sees after getting the item wrong, so a blank
        explanation makes the mistake unrecoverable -- they are told they were
        wrong and nothing else. It was previously only an advisory warning in
        `app.domain.validation.questions`, which meant an unexplained question
        reached an admin, and then a learner, with nothing stopping it.
        """
        if len(self.explanation.strip()) < MIN_EXPLANATION_CHARS:
            raise ValueError(
                f"every question needs an explanation of at least "
                f"{MIN_EXPLANATION_CHARS} characters, stating what the item tests "
                "and why the correct answer is correct"
            )

        if self.question_type == "MCQ":
            self._require_an_explanation_per_choice()
        return self

    def _require_an_explanation_per_choice(self) -> None:
        """Every choice explains itself -- including the ones nobody should pick.

        Enforced rather than repaired, unlike the open-ended SHORT_ANSWER case:
        there the content existed and only its label was wrong, so it could be
        fixed locally. A missing explanation cannot be invented here without
        fabricating teaching material, so the only honest options are to reject
        and resample, or to ship a distractor that says nothing about why it is
        wrong. A length mismatch is rejected for the same reason it cannot be
        silently trimmed: misaligned explanations would tell a learner their
        correct answer was wrong.
        """
        if len(self.choice_explanations) != len(self.choices):
            raise ValueError(
                f"MCQ needs one explanation per choice: got "
                f"{len(self.choice_explanations)} for {len(self.choices)} choices. "
                "Each entry says why that option is right, or which misconception "
                "makes it wrong."
            )
        for index, text in enumerate(self.choice_explanations):
            if len((text or "").strip()) < MIN_CHOICE_EXPLANATION_CHARS:
                raise ValueError(
                    f"choice {index + 1}'s explanation is empty or too short; a "
                    "learner who picked it must be told why it is wrong, not just "
                    "that it is"
                )

class QuestionBatch(BaseModel):
    scope: str
    questions: List[QuestionDraft]

