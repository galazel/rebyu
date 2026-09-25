"""Import an official past paper into a certification's question bank.

Two steps, deliberately separate:

    POST /past-papers/parse    upload the paper and its answer key, get
                               drafts back -- nothing is written
    POST /past-papers/import   write the drafts the admin approved

They are separate because the parse is the part that can be wrong in ways
only a person notices. Lesson assignment is an embedding match that agrees
with a careful reading about eight times in ten, and a handful of questions
per paper do not survive the PDF text layer at all. A single "upload and
import" call would bury both behind a success message.

The parse is synchronous. A paper takes tens of seconds, which is slow for a
request and much simpler than a job queue for something an admin does twice a
year per certification; if that stops being true it belongs in the workflow
registry alongside generation.
"""

from __future__ import annotations

import logging
import re
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.core.security import require_service_key
from app.db.session import SessionLocal
from app.papers.importer import parse_upload

router = APIRouter(
    prefix="/past-papers",
    tags=["past-papers"],
    dependencies=[Depends(require_service_key)],
)

logger = logging.getLogger(__name__)

MAX_PDF_BYTES = 40 * 1024 * 1024

#: The citation is built from this, so it is validated rather than trusted:
#: a wrong label produces a wrong attribution on every question in the paper.
PAPER_NAME_RE = re.compile(r"^\d{4}[ASas]_(FE-[AB]|FE_(AM|PM)|IP)$")


class DraftChoice(BaseModel):
    letter: str
    text: str = ""
    imageKey: str | None = None


class ApprovedQuestion(BaseModel):
    stem: str
    citation: str
    answer: str
    lessonId: int
    choices: list[DraftChoice]
    imageKey: str | None = None
    difficulty: Literal["EASY", "AVERAGE", "HARD"] = "AVERAGE"


class ImportRequest(BaseModel):
    certificationId: int
    questions: list[ApprovedQuestion] = Field(default_factory=list)


class PageFigure(BaseModel):
    id: str
    top: float
    bottom: float


class ReadPageRequest(BaseModel):
    image: str = Field(max_length=8_000_000)
    text: str = ""
    figures: list[PageFigure] = Field(default_factory=list, max_length=60)
    previousId: str | None = None
    openIds: list[str] = Field(default_factory=list, max_length=60)


class SuggestLessonsRequest(BaseModel):
    certificationId: int
    questions: list[str] = Field(default_factory=list, max_length=500)
    #: The question stems alone, for duplicate detection; the full texts above
    #: carry the options too, which the bank's stored text does not.
    stems: list[str] = Field(default_factory=list, max_length=500)


async def _read(upload: UploadFile) -> bytes:
    data = await upload.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"{upload.filename or 'file'} is empty.")
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            f"{upload.filename or 'file'} exceeds 40MB.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"{upload.filename or 'file'} is not a PDF.")
    return data


@router.post("/parse")
async def parse_paper(
    certification_id: Annotated[int, Form()],
    paper_name: Annotated[str, Form()],
    kind: Annotated[str, Form()] = "subject_a",
    questions: UploadFile = File(...),
    answers: UploadFile = File(...),
):
    """Parses an uploaded paper and returns drafts for review."""
    if not PAPER_NAME_RE.match(paper_name):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "paper_name must look like 2025A_FE-A, 2023S_FE_AM or 2024A_IP -- "
            "it is what the required source citation is built from.")
    if kind not in ("subject_a", "subject_b"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "kind must be subject_a or subject_b.")

    questions_pdf = await _read(questions)
    answers_pdf = await _read(answers)

    try:
        drafts = await parse_upload(paper_name, questions_pdf, answers_pdf,
                                    certification_id, kind=kind)
    except Exception as error:  # noqa: BLE001 -- surfaced to the admin as-is
        logger.exception("Past-paper parse failed for %s", paper_name)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            f"Could not parse this paper: {error}") from error

    importable = [d for d in drafts if d.importable]
    return {
        "paperName": paper_name,
        "certificationId": certification_id,
        "total": len(drafts),
        "importable": len(importable),
        "needsAttention": len(drafts) - len(importable),
        "weakMatches": sum(1 for d in importable if d.lesson_score < 0.3),
        "questions": [d.as_dict() for d in drafts],
    }


@router.post("/read-layout")
async def read_layout_route(file: UploadFile = File(...)):
    """Every question in a PDF of any layout, read without a generative model.

    Docling finds the page layout; question profiles read the questions,
    choices, answers and figure positions from it. See
    `app.papers.layout_reader`. Writes nothing.
    """
    from starlette.concurrency import run_in_threadpool

    from app.papers.layout_reader import read_document

    data = await _read(file)
    try:
        # CPU-bound for tens of seconds; off the event loop.
        return await run_in_threadpool(read_document, data)
    except Exception as error:  # noqa: BLE001 -- surfaced to the admin
        logger.exception("Layout reading failed for %s", file.filename)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            f"The document's layout could not be read: {error}") from error


@router.post("/read-page")
async def read_page_route(request: ReadPageRequest):
    """The questions on one page of a document the browser's reader does not
    know, read by the EXTRACTION vision model. Writes nothing."""
    from app.papers.page_reader import read_page

    try:
        return await read_page(
            request.image, request.text,
            [f.model_dump() for f in request.figures], request.previousId,
            request.openIds)
    except RuntimeError as error:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(error)) from error


class DuplicatesRequest(BaseModel):
    certificationId: int
    stems: list[str] = Field(default_factory=list, max_length=1000)


@router.post("/duplicates")
def duplicates_route(request: DuplicatesRequest):
    """For each stem, "bank" when the certification's question bank already
    holds it, "paper" when an earlier stem in the same list is the same
    question, else null. Run as soon as a paper is read, so duplicates are
    flagged before anything is tagged or saved."""
    from app.papers.tagger import find_duplicates

    session = SessionLocal()
    try:
        return {"duplicates": find_duplicates(session, request.certificationId, request.stems)}
    finally:
        session.close()


@router.post("/tag")
async def tag_questions_route(request: SuggestLessonsRequest):
    """A lesson and a difficulty for each question, for review before saving.

    The TAGGING model (Grok, with free fallbacks) decides; any question it
    could not answer is filed by the local embedding match instead, with its
    difficulty left for the reviewer.
    """
    from app.papers.tagger import find_duplicates, tag_questions

    session = SessionLocal()
    try:
        tags, lessons = await tag_questions(
            session, request.certificationId, request.questions)
        duplicates = find_duplicates(
            session, request.certificationId, request.stems or request.questions)
    finally:
        session.close()
    if not lessons:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "This certification has no lessons to file questions under.")
    for tag, duplicate in zip(tags, duplicates):
        tag["duplicate"] = duplicate
    return {"tags": tags, "lessons": lessons}


class TagJobPaper(BaseModel):
    paperId: str = Field(max_length=300)
    name: str = Field(default="", max_length=300)
    #: Each question's number on the page, in the order of `questions`: the
    #: page applies a paper's tags by number when it collects them.
    nums: list[int | str] = Field(default_factory=list, max_length=500)
    questions: list[str] = Field(default_factory=list, max_length=500)
    stems: list[str] = Field(default_factory=list, max_length=500)


class TagJobRequest(BaseModel):
    certificationId: int
    papers: list[TagJobPaper] = Field(default_factory=list, min_length=1, max_length=400)


@router.post("/tag-jobs")
async def start_tag_job(request: TagJobRequest):
    """Tags every paper in the background; the page polls the job.

    Returns at once. The work carries on if the admin leaves or refreshes the
    page -- see `app.papers.tag_jobs`.
    """
    from app.papers import tag_jobs

    return await tag_jobs.start_job(
        request.certificationId, [paper.model_dump() for paper in request.papers])


@router.get("/tag-jobs/latest")
async def latest_tag_job(certificationId: int):
    """The certification's most recent tagging job, or {"job": null}."""
    from app.papers import tag_jobs

    return {"job": await tag_jobs.latest_job(certificationId)}


@router.get("/tag-jobs/{job_id}")
async def get_tag_job(job_id: str):
    from app.papers import tag_jobs

    job = await tag_jobs.get_job(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That tagging job is not known -- it may have expired.")
    return job


@router.post("/tag-jobs/{job_id}/cancel")
async def cancel_tag_job(job_id: str):
    from app.papers import tag_jobs

    job = await tag_jobs.cancel_job(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That tagging job is not known -- it may have expired.")
    return job


@router.post("/suggest-lessons")
def suggest_lessons_route(request: SuggestLessonsRequest):
    """The lesson each question most likely belongs to, for review.

    The same local embedding match the paper import files questions with --
    no paid model. It agrees with a careful reading about eight times in ten,
    so the scores go back with the suggestions and the reviewer decides.
    """
    from app.papers.mapping import suggest_lessons

    session = SessionLocal()
    try:
        suggestions, lessons = suggest_lessons(
            session, request.certificationId, request.questions)
    finally:
        session.close()
    if not lessons:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "This certification has no lessons to file questions under.")
    return {"suggestions": suggestions, "lessons": lessons}


@router.post("/import")
def import_questions(request: ImportRequest):
    """Writes the approved drafts. Idempotent on (lesson, question text)."""
    if not request.questions:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "No questions were approved for import.")

    added = skipped = 0
    session = SessionLocal()
    try:
        # Every lesson must belong to the certification being imported into;
        # a draft edited in the browser is not trusted to say so.
        allowed = {row[0] for row in session.execute(text("""
            select l.lesson_id from lessons l
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c"""), {"c": request.certificationId})}
        stray = sorted({q.lessonId for q in request.questions} - allowed)
        if stray:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Lessons {stray} do not belong to certification {request.certificationId}.")

        for item in request.questions:
            letters = {choice.letter for choice in item.choices}
            if item.answer not in letters:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Answer '{item.answer}' is not one of the options provided.")

            # The citation is appended here rather than trusted from the
            # client, so an edited draft cannot arrive without one.
            stem = item.stem.strip()
            if item.citation and item.citation not in stem:
                stem = stem + "\n\n" + item.citation.strip()

            exists = session.execute(text("""
                select 1 from questions
                 where lesson_id = :lesson and question_text = :stem limit 1"""),
                {"lesson": item.lessonId, "stem": stem}).first()
            if exists:
                skipped += 1
                continue

            question_id = session.execute(text("""
                insert into public.questions
                    (question_text, question_type, difficulty_level, lesson_id,
                     image_key, created_at)
                values (:stem, 'MCQ', :difficulty, :lesson, :image, now())
                returning question_id"""), {
                "stem": stem, "difficulty": item.difficulty,
                "lesson": item.lessonId, "image": item.imageKey,
            }).scalar()

            for choice in item.choices:
                session.execute(text("""
                    insert into public.choices
                        (choice_text, is_correct, explanation, image_key, question_id)
                    values (:text, :correct, null, :image, :question)"""), {
                    "text": choice.text or "",
                    "correct": choice.letter == item.answer,
                    "image": choice.imageKey,
                    "question": question_id,
                })
            added += 1

        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception as error:  # noqa: BLE001
        session.rollback()
        logger.exception("Past-paper import failed")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            f"Import failed and nothing was written: {error}") from error
    finally:
        session.close()

    return {"added": added, "alreadyPresent": skipped}
