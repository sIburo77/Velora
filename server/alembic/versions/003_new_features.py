"""Add comments, attachments, chat, notifications tables; migrate owner->admin

Revision ID: 003
Revises: 002
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Migrate owner -> admin
    op.execute("UPDATE workspace_members SET role = 'admin' WHERE role = 'owner'")

    # Task comments
    op.create_table(
        'task_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Task attachments
    op.create_table(
        'task_attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('stored_filename', sa.String(500), nullable=False),
        sa.Column('content_type', sa.String(255), nullable=False),
        sa.Column('size_bytes', sa.Integer, nullable=False),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Chat messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_chat_messages_workspace_created', 'chat_messages',
                    ['workspace_id', 'created_at'])

    # Notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('body', sa.Text, nullable=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='SET NULL'), nullable=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_read', sa.Boolean, server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('chat_messages')
    op.drop_table('task_attachments')
    op.drop_table('task_comments')
    op.execute("UPDATE workspace_members SET role = 'owner' WHERE role = 'admin'")
