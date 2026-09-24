"""Turns an uploaded past paper into reviewable question drafts.

This is the service behind the certification workflow's "Import past paper"
step. It does what the batch scripts do, but for one paper at a time, against
files that arrive as uploads rather than sitting on disk, and it stops before
writing: an admin reviews the drafts and decides what is imported.

The review step is not decoration. Two things about this material make it
mandatory:

  * Lesson assignment is an embedding match. It agrees with a careful human
    reading about eight times in ten, which is useful and is not good enough
    to write unattended into a curriculum.

  * A small share of questions do not survive the text layer -- stacked
    fractions, options that are pictures, the occasional missing bracket.
    They are detected and reported rather than guessed at.

Nothing here calls a paid API.
"""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass, field
from typing import Any, Literal

PaperKind = Literal["subject_a", "subject_b"]


@dataclass
class ImportedQuestion:
    number: int
    stem: str
    choices: dict[str, str]
    answer: str | None
    lesson_id: int | None = None
    lesson_name: str | None = None
    lesson_score: float = 0.0
    image_key: str | None = None
    choice_images: dict[str, str] = field(default_factory=dict)
    citation: str = ""
    issues: list[str] = field(default_factory=list)

    @property
    def importable(self) -> bool:
        return not self.issues

    def as_dict(self) -> dict[str, Any]:
        return {
            "number": self.number,
            "stem": self.stem,
            "choices": self.choices,
            "answer": self.answer,
            "lessonId": self.lesson_id,
            "lessonName": self.lesson_name,
            "lessonScore": round(self.lesson_score, 3),
            "imageKey": self.image_key,
            "choiceImages": self.choice_images,
            "citation": self.citation,
            "issues": self.issues,
            "importable": self.importable,
        }


def citation(paper: str, number: int, *, has_figure: bool,
             has_choice_images: bool, joined_columns: bool) -> str:
    """The source line the ITPEC/IPA terms require, plus any modification note.

    The format is theirs: (YearSeason, Exam Category, (Subject), Question
    number). Modifications must be stated, and three arise here -- a figure
    re-rendered as an image, options that are pictures, and the columns of a
    combination answer joined, none of which the printed page does.
    """
    season = paper.split("_")[0]
    if "_IP" in paper:
        reference = f"({season}, IP, Q{number})"
    elif "FE-B" in paper:
        reference = f"({season}, FE, Subject-B, Q{number})"
    else:
        reference = f"({season}, FE, Subject-A, Q{number})"

    notes = []
    if has_figure:
        notes.append("figures and tables supplied as an image rendered from "
                     "the original paper")
    if has_choice_images:
        notes.append("answer options supplied as images rendered from the "
                     "original paper")
    if joined_columns:
        notes.append("columns of the original answer table joined with '|'")

    line = "Source: " + reference
    if notes:
        line += " -- adapted: " + "; ".join(notes) + "."
    return line


def _detect_issues(record: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    if not record.get("answer"):
        issues.append("no answer in the key for this number")
    choices = record.get("choices") or {}
    if not 2 <= len(choices) <= 10:
        issues.append(f"{len(choices)} options parsed")
    elif record.get("answer") and record["answer"] not in choices:
        issues.append(f"key is '{record['answer']}' but that option was not parsed")
    images = record.get("choice_images") or {}
    empty = [k for k, v in choices.items() if not v.strip() and k not in images]
    if empty:
        issues.append("options with no text or picture: " + ", ".join(sorted(empty)))
    if len(record.get("stem", "")) < 15:
        issues.append("stem did not extract")
    return issues


async def parse_upload(paper_name: str, questions_pdf: bytes, answers_pdf: bytes,
                       certification_id: int, *, kind: PaperKind = "subject_a",
                       upload_figures: bool = True,
                       use_figure_agent: bool = True) -> list[ImportedQuestion]:
    """Parses one uploaded paper and returns reviewable drafts.

    `paper_name` is what the citation is built from, so it must carry the
    session and subject -- "2025A_FE-A", "2024S_IP". The UI collects it
    rather than guessing from the filename, because the citation is a legal
    requirement and a filename is not evidence.
    """
    workdir = tempfile.mkdtemp(prefix="paper-import-")
    pdf_dir = os.path.join(workdir, "pdf") + os.sep
    parsed_dir = os.path.join(workdir, "parsed") + os.sep
    render_dir = os.path.join(workdir, "rendered") + os.sep
    for directory in (pdf_dir, parsed_dir, render_dir):
        os.makedirs(directory, exist_ok=True)

    with open(pdf_dir + paper_name + "_Questions.pdf", "wb") as handle:
        handle.write(questions_pdf)
    with open(pdf_dir + paper_name + "_Answers.pdf", "wb") as handle:
        handle.write(answers_pdf)

    # The pipeline modules read their directories from the environment so a
    # request can work in its own scratch space rather than a shared one.
    os.environ["PAPERS_PDF_DIR"] = pdf_dir
    os.environ["PAPERS_PARSED_DIR"] = parsed_dir
    os.environ["PAPERS_RENDER_DIR"] = render_dir

    from app.papers import figures, mapping, subject_a, subject_b

    for module in (subject_a, subject_b, figures, mapping):
        module.PDF_DIR = pdf_dir
        if hasattr(module, "OUT_DIR"):
            module.OUT_DIR = parsed_dir
        if hasattr(module, "PARSED_DIR"):
            module.PARSED_DIR = parsed_dir
        if hasattr(module, "RENDER_DIR"):
            module.RENDER_DIR = render_dir

    parser = subject_b if kind == "subject_b" else subject_a
    parser.parse(paper_name)

    if upload_figures:
        # The assisted path: the vision agent is asked about the questions
        # whose figures the geometry could not confidently classify, so an
        # uploaded paper whose options are pictures arrives with per-choice
        # images rather than one composite and four buttons of scraped
        # drawing labels. Degrades to pure geometry when the agent is off or
        # unreachable.
        await figures.run_assisted(paper_name, True, use_agent=use_figure_agent)

    mapping.PARSED_DIR = parsed_dir
    mapping.main_for(certification_id, [paper_name])

    with open(parsed_dir + paper_name + ".json", encoding="utf-8") as handle:
        records = json.load(handle)

    drafts = []
    for record in records:
        choices = record.get("choices") or {}
        draft = ImportedQuestion(
            number=record["number"],
            stem=record.get("stem", ""),
            choices=choices,
            answer=record.get("answer"),
            lesson_id=record.get("lesson_id"),
            lesson_name=record.get("lesson_name"),
            lesson_score=record.get("lesson_score", 0.0),
            image_key=record.get("image_key"),
            choice_images=record.get("choice_images") or {},
            issues=_detect_issues(record),
        )
        draft.citation = citation(
            paper_name, draft.number,
            has_figure=bool(draft.image_key),
            has_choice_images=bool(draft.choice_images),
            joined_columns=any("|" in value for value in choices.values()),
        )
        drafts.append(draft)
    return drafts
