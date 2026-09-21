"""Add mastery evidence columns, history, priority, and idempotency tables.

Revision ID: 20260712_0002
Revises: 20260712_0001
Create Date: 2026-07-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260712_0002"
down_revision: Union[str, None] = "20260712_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # learner_lesson_mastery: evidence counters + curriculum path
    op.add_column(
        "learner_lesson_mastery",
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "learner_lesson_mastery",
        sa.Column("incorrect_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("learner_lesson_mastery", sa.Column("certification_id", sa.BigInteger()))
    op.add_column("learner_lesson_mastery", sa.Column("middle_category_id", sa.BigInteger()))
    op.add_column("learner_lesson_mastery", sa.Column("major_category_id", sa.BigInteger()))
    op.add_column("learner_lesson_mastery", sa.Column("lesson_title", sa.String(200)))
    op.add_column("learner_lesson_mastery", sa.Column("middle_category_title", sa.String(200)))
    op.add_column("learner_lesson_mastery", sa.Column("major_category_title", sa.String(200)))
    op.add_column("learner_lesson_mastery", sa.Column("last_assessment_type", sa.String(30)))
    op.create_index(
        "ix_mastery_learner_certification",
        "learner_lesson_mastery",
        ["learner_id", "certification_id"],
    )

    # idempotency ledger
    op.create_table(
        "bkt_processed_events",
        sa.Column("processed_event_id", sa.String(36), primary_key=True),
        sa.Column("event_id", sa.String(150), nullable=False),
        sa.Column("batch_id", sa.String(120)),
        sa.Column("learner_id", sa.BigInteger(), nullable=False),
        sa.Column("certification_id", sa.BigInteger()),
        sa.Column("exam_result_id", sa.BigInteger()),
        sa.Column("exam_question_id", sa.BigInteger()),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column("processing_status", sa.String(20), nullable=False, server_default="PROCESSED"),
        sa.Column("processing_result_json", sa.JSON()),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_bkt_processed_events_event_id", "bkt_processed_events", ["event_id"], unique=True
    )

    # mastery history
    op.create_table(
        "learner_lesson_mastery_history",
        sa.Column("mastery_history_id", sa.String(36), primary_key=True),
        sa.Column("event_id", sa.String(150)),
        sa.Column("learner_id", sa.BigInteger(), nullable=False),
        sa.Column("certification_id", sa.BigInteger()),
        sa.Column("lesson_id", sa.BigInteger(), nullable=False),
        sa.Column("previous_mastery", sa.Float(), nullable=False),
        sa.Column("observation_posterior", sa.Float(), nullable=False),
        sa.Column("final_mastery", sa.Float(), nullable=False),
        sa.Column("previous_mastery_level", sa.String(20)),
        sa.Column("new_mastery_level", sa.String(20), nullable=False),
        sa.Column("observed_correct", sa.Boolean(), nullable=False),
        sa.Column("score_awarded", sa.Float()),
        sa.Column("maximum_score", sa.Float()),
        sa.Column("assessment_type", sa.String(30), nullable=False),
        sa.Column("question_type", sa.String(30)),
        sa.Column("difficulty_level", sa.String(20), nullable=False),
        sa.Column("model_version", sa.String(80)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_mastery_history_event_id", "learner_lesson_mastery_history", ["event_id"])
    op.create_index(
        "ix_mastery_history_learner_lesson",
        "learner_lesson_mastery_history",
        ["learner_id", "lesson_id", "created_at"],
    )

    # current category priorities
    op.create_table(
        "learner_category_priorities",
        sa.Column("learner_category_priority_id", sa.String(36), primary_key=True),
        sa.Column("learner_id", sa.BigInteger(), nullable=False),
        sa.Column("certification_id", sa.BigInteger(), nullable=False),
        sa.Column("category_type", sa.String(10), nullable=False),
        sa.Column("category_key", sa.String(40), nullable=False),
        sa.Column("major_category_id", sa.BigInteger()),
        sa.Column("middle_category_id", sa.BigInteger()),
        sa.Column("lesson_id", sa.BigInteger()),
        sa.Column("category_title", sa.String(200)),
        sa.Column("mastery_probability", sa.Float()),
        sa.Column("mastery_level", sa.String(20)),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column("priority_tag", sa.String(30), nullable=False),
        sa.Column("priority_label", sa.String(50), nullable=False),
        sa.Column("primary_reason", sa.Text()),
        sa.Column("reasons_json", sa.JSON()),
        sa.Column("recommended_action", sa.Text()),
        sa.Column("recommended_activity", sa.String(40)),
        sa.Column("evidence_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_version", sa.String(80)),
        sa.Column("last_assessment_type", sa.String(30)),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "learner_id", "certification_id", "category_key",
            name="uq_learner_category_priority",
        ),
    )
    op.create_index(
        "ix_category_priority_learner_cert",
        "learner_category_priorities",
        ["learner_id", "certification_id"],
    )
    op.create_index("ix_category_priority_tag", "learner_category_priorities", ["priority_tag"])
    op.create_index("ix_category_priority_score", "learner_category_priorities", ["priority_score"])

    # priority history
    op.create_table(
        "learner_category_priority_history",
        sa.Column("priority_history_id", sa.String(36), primary_key=True),
        sa.Column("learner_id", sa.BigInteger(), nullable=False),
        sa.Column("certification_id", sa.BigInteger(), nullable=False),
        sa.Column("category_type", sa.String(10), nullable=False),
        sa.Column("category_id", sa.BigInteger()),
        sa.Column("previous_priority_score", sa.Float()),
        sa.Column("new_priority_score", sa.Float()),
        sa.Column("previous_priority_tag", sa.String(30)),
        sa.Column("new_priority_tag", sa.String(30)),
        sa.Column("primary_reason", sa.Text()),
        sa.Column("source_event_id", sa.String(150)),
        sa.Column("exam_id", sa.BigInteger()),
        sa.Column("exam_result_id", sa.BigInteger()),
        sa.Column("assessment_type", sa.String(30)),
        sa.Column("model_version", sa.String(80)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_priority_history_learner_cert",
        "learner_category_priority_history",
        ["learner_id", "certification_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_table("learner_category_priority_history")
    op.drop_table("learner_category_priorities")
    op.drop_table("learner_lesson_mastery_history")
    op.drop_table("bkt_processed_events")
    op.drop_index("ix_mastery_learner_certification", table_name="learner_lesson_mastery")
    for column in (
        "last_assessment_type",
        "major_category_title",
        "middle_category_title",
        "lesson_title",
        "major_category_id",
        "middle_category_id",
        "certification_id",
        "incorrect_count",
        "correct_count",
    ):
        op.drop_column("learner_lesson_mastery", column)
