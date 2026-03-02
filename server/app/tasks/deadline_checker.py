import asyncio
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import async_session_maker
from app.models.task import Task
from app.models.column import Column
from app.models.notification import Notification

logger = logging.getLogger(__name__)

INTERVAL_SECONDS = 3600  # Check every hour


async def check_deadlines():
    """Find tasks with deadlines in the next 24 hours and create notifications."""
    async with async_session_maker() as db:
        now = datetime.now(timezone.utc)
        deadline_threshold = now + timedelta(hours=24)

        result = await db.execute(
            select(Task)
            .join(Column, Column.id == Task.column_id)
            .where(
                Task.deadline.isnot(None),
                Task.is_completed == False,
                Task.deadline >= now,
                Task.deadline <= deadline_threshold,
            )
        )
        tasks = result.scalars().all()

        for task in tasks:
            user_id = task.assigned_to or task.created_by
            if not user_id:
                continue

            # Check if we already sent a reminder for this task recently
            existing = await db.execute(
                select(Notification).where(
                    Notification.user_id == user_id,
                    Notification.type == "deadline",
                    Notification.task_id == task.id,
                    Notification.created_at >= now - timedelta(hours=23),
                )
            )
            if existing.scalar_one_or_none():
                continue

            hours_left = int((task.deadline - now).total_seconds() / 3600)
            notification = Notification(
                user_id=user_id,
                type="deadline",
                title=f"Deadline approaching: {task.title}",
                body=f"Due in ~{hours_left}h",
                task_id=task.id,
            )
            db.add(notification)

        await db.commit()
        logger.info(f"Deadline check: {len(tasks)} tasks approaching deadline")


async def deadline_checker_loop():
    """Background loop that periodically checks deadlines."""
    while True:
        try:
            await check_deadlines()
        except Exception as e:
            logger.error(f"Deadline checker error: {e}")
        await asyncio.sleep(INTERVAL_SECONDS)
