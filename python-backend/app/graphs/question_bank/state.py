from typing import TypedDict, List, Dict, Optional, Annotated
from operator import add


class QuestionBankState(TypedDict, total=False):
    thread_id: str

    certification_id: int
    certification_name: str
    scope_type: str
    scope_label: str
    document_refs: List[Dict]
    uploaded_files: List[Dict]

    target_total: int
    difficulty_focus: Optional[str]
    auto_approve: bool
    batch_size: int
    type_distribution: Optional[Dict[str, int]]

    reference_context: str

    current_batch: List[Dict]
    generated_count: int

    validation_report: Optional[Dict]

    review_action: Optional[str]
    review_instructions: Optional[str]
    review_edited_questions: Optional[List[Dict]]
    review_restored_from: Optional[int]

    approved_questions: Annotated[List[Dict], add]

    version_refs: Annotated[List[Dict], add]

    status: str
    error_message: Optional[str]
