"""Add file_url and file_name to chat_messages

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("file_url", sa.String(500), nullable=True))
    op.add_column("chat_messages", sa.Column("file_name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "file_name")
    op.drop_column("chat_messages", "file_url")
