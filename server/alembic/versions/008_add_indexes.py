"""Add performance indexes"""

from typing import Sequence, Union

from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_tasks_assigned_to", "tasks", ["assigned_to"])
    op.create_index("ix_tasks_is_completed", "tasks", ["is_completed"])
    op.create_index("ix_tasks_deadline", "tasks", ["deadline"])
    op.create_index("ix_tasks_column_position", "tasks", ["column_id", "position"])
    op.create_index("ix_columns_board_id", "columns", ["board_id"])
    op.create_index("ix_boards_workspace_id", "boards", ["workspace_id"])
    op.create_index("ix_workspace_members_ws_user", "workspace_members", ["workspace_id", "user_id"], unique=True)
    op.create_index("ix_task_comments_task_id", "task_comments", ["task_id"])


def downgrade() -> None:
    op.drop_index("ix_task_comments_task_id", table_name="task_comments")
    op.drop_index("ix_workspace_members_ws_user", table_name="workspace_members")
    op.drop_index("ix_boards_workspace_id", table_name="boards")
    op.drop_index("ix_columns_board_id", table_name="columns")
    op.drop_index("ix_tasks_column_position", table_name="tasks")
    op.drop_index("ix_tasks_deadline", table_name="tasks")
    op.drop_index("ix_tasks_is_completed", table_name="tasks")
    op.drop_index("ix_tasks_assigned_to", table_name="tasks")
