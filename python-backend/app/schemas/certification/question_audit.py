from pydantic import BaseModel, Field


class DuplicateGroup(BaseModel):
    """Questions that test the same thing. `keep` and `duplicates` are the
    numbers the prompt labelled each question with, not database ids."""

    keep: int
    duplicates: list[int] = Field(default_factory=list)
    reason: str = ""


class QuestionAuditResult(BaseModel):
    groups: list[DuplicateGroup] = Field(default_factory=list)
    summary: str = ""
