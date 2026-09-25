"""AI model chosen per task from the admin AI settings page.

Revision ID: 20260925_0005
Revises: 20260726_0004
Create Date: 2026-09-25

One row per task whose model an administrator changed. A task with no row
uses the model configured in the environment, so an empty table is exactly
the behaviour before this page existed.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260925_0005"
down_revision: Union[str, None] = "20260726_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_model_overrides",
        sa.Column("task", sa.String(length=40), primary_key=True),
        sa.Column("model", sa.String(length=200), nullable=False),
        sa.Column("updated_by", sa.String(length=200), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("ai_model_overrides")
