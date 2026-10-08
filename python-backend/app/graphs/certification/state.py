from typing import TypedDict, List, Dict, Optional, Annotated


def _keyed_merge(key_fields: tuple):
    """Builds a LangGraph reducer that upserts by a composite key instead of
    blindly concatenating. Send()-based fan-out nodes (lessons, major/middle/
    lesson quizzes) genuinely need an additive reducer to collect parallel
    branch outputs, but a plain `operator.add` also re-appends stale entries
    whenever a stage is regenerated (selective lesson retry, or a HITL
    "regenerate" decision re-running a fan-out) instead of replacing them."""

    def reducer(existing: List[Dict], new: List[Dict]) -> List[Dict]:
        merged = {tuple(item.get(f) for f in key_fields): item for item in (existing or [])}
        for item in new or []:
            merged[tuple(item.get(f) for f in key_fields)] = item
        return list(merged.values())

    return reducer


_merge_lessons = _keyed_merge(("name",))
_merge_major_quizzes = _keyed_merge(("majorCategory",))
_merge_middle_quizzes = _keyed_merge(("majorCategory", "middleCategory"))
_merge_lesson_quizzes = _keyed_merge(("lesson",))


class CertificationState(TypedDict, total=False):
    certification_id: int
    certification_name: str
    certification_description: str
    industry: str

    requested_question_types: List[str]

    requested_bank_size: Optional[int]

    requested_lesson_count: Optional[int]

    existing_curriculum: str

    additional_instructions: str

    document_refs: List[Dict]

    uploaded_files: List[Dict]

    document_visuals: List[Dict]

    curriculum: Dict

    major: Dict
    middle: Dict
    lesson: Dict

    lesson_content_ahead: Dict

    lesson_quiz_ahead: Dict
    lesson_audit_ahead: Dict

    lessons: Annotated[List[Dict], _merge_lessons]
    major_quizzes: Annotated[List[Dict], _merge_major_quizzes]
    middle_quizzes: Annotated[List[Dict], _merge_middle_quizzes]
    lesson_quizzes: Annotated[List[Dict], _merge_lesson_quizzes]
    diagnostic_exam: Dict
    mock_exam: Dict
    question_bank: List[Dict]

    major_cursor: int
    middle_cursor: int
    lesson_cursor: int

    review_mode: str

    auto_approve_scopes: List[str]

    quality_retried: List[str]

    rejected_items: List[Dict]

    thread_id: str

    version_refs: List[Dict]

    review_instructions: Optional[str]
    review_edited_payload: Optional[Dict]
    review_restored_from: Optional[int]

    audit_result: Optional[Dict]
    question_audit: Optional[Dict]
    validation_report: Optional[Dict]
    review_decision: Optional[str]

    vector_store_id: str

    status: str
    error_message: Optional[str]


def curriculum_totals(curriculum: Dict | None) -> Dict[str, int]:
    """How many majors, middle categories and lessons a curriculum implies.

    This is the denominator of a run's progress. The whole per-item walk is
    driven by these three lists (see `review_loop.LoopPhase.items_of`), so
    counting them counts the work the run has left -- and until the curriculum
    exists there is no honest denominator at all, which is why callers have to
    handle a plan of zero lessons rather than being given a guess.
    """
    majors = (curriculum or {}).get("majorCategories") or []
    middles = [
        middle for major in majors for middle in (major.get("middleCategories") or [])
    ]
    lessons = [lesson for middle in middles for lesson in (middle.get("lessons") or [])]
    return {"majors": len(majors), "middles": len(middles), "lessons": len(lessons)}
