"""Add email verification and Google OAuth

Revision ID: 002
Revises: 001
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users: add is_verified, google_id; make hashed_password nullable
    op.add_column('users', sa.Column('is_verified', sa.Boolean, server_default='true', nullable=False))
    op.add_column('users', sa.Column('google_id', sa.String(255), unique=True, nullable=True))
    op.alter_column('users', 'hashed_password', existing_type=sa.String(255), nullable=True)

    # Verification codes table
    op.create_table(
        'verification_codes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, index=True),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('verification_codes')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'is_verified')
    op.alter_column('users', 'hashed_password', existing_type=sa.String(255), nullable=False)
