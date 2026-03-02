import uuid
import re
import asyncio

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import decode_access_token
from app.core.database import get_db
from app.api.routes import auth, users, workspaces, invitations, boards
from app.api.routes import comments, attachments, chat, notifications, tags, activity_logs
from app.ws_manager import manager
from app.repositories.chat_repo import ChatRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.notification_repo import NotificationRepository
from app.tasks.deadline_checker import deadline_checker_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(deadline_checker_loop())
    yield
    task.cancel()


app = FastAPI(
    title="Velora",
    description="Task Planner + CRM Board API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")
app.include_router(boards.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(activity_logs.router, prefix="/api")


def _authenticate_ws(token: str) -> uuid.UUID | None:
    payload = decode_access_token(token)
    if not payload:
        return None
    sub = payload.get("sub")
    return uuid.UUID(sub) if sub else None


@app.websocket("/ws/chat/{workspace_id}")
async def ws_chat(websocket: WebSocket, workspace_id: uuid.UUID, token: str = Query(...)):
    user_id = _authenticate_ws(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    async for db in get_db():
        workspace_repo = WorkspaceRepository(db)
        member = await workspace_repo.get_member(workspace_id, user_id)
        if not member:
            await websocket.close(code=4003)
            return

        await manager.connect_chat(workspace_id, user_id, websocket)
        chat_repo = ChatRepository(db)

        try:
            while True:
                data = await websocket.receive_json()
                content = data.get("content", "").strip()
                file_url = data.get("file_url")
                file_name = data.get("file_name")
                reply_to_id = data.get("reply_to_id")
                if not content and not file_url:
                    continue

                reply_uuid = None
                if reply_to_id:
                    try:
                        reply_uuid = uuid.UUID(reply_to_id)
                    except (ValueError, TypeError):
                        pass

                msg = await chat_repo.create(
                    workspace_id, user_id, content or "",
                    file_url=file_url, file_name=file_name,
                    reply_to_id=reply_uuid,
                )
                await manager.broadcast_chat(workspace_id, {
                    "id": str(msg.id),
                    "workspace_id": str(msg.workspace_id),
                    "author_id": str(msg.author_id),
                    "content": msg.content,
                    "file_url": msg.file_url,
                    "file_name": msg.file_name,
                    "created_at": msg.created_at.isoformat(),
                    "author_name": msg.author.name if msg.author else None,
                    "author_avatar": msg.author.avatar_url if msg.author else None,
                    "reply_to_id": str(msg.reply_to_id) if msg.reply_to_id else None,
                    "reply_to_content": msg.reply_to.content if msg.reply_to else None,
                    "reply_to_author_name": msg.reply_to.author.name if msg.reply_to and msg.reply_to.author else None,
                })

                # Handle @mentions in chat
                if content:
                    mentioned_names = re.findall(r'@([A-Za-zА-Яа-яёЁ][\w\s]*?)(?=\s@|[.,!?;:\n]|$)', content)
                    if mentioned_names:
                        notification_repo = NotificationRepository(db)
                        members = await workspace_repo.get_members(workspace_id)
                        author_name = msg.author.name if msg.author else "Someone"
                        for m in members:
                            if m.user and m.user_id != user_id:
                                for name in mentioned_names:
                                    if m.user.name and m.user.name.lower() == name.strip().lower():
                                        await notification_repo.create(
                                            user_id=m.user_id,
                                            type="mention",
                                            title=f"{author_name} mentioned you in chat",
                                            body=content[:200],
                                            workspace_id=workspace_id,
                                        )
                                        break
        except WebSocketDisconnect:
            manager.disconnect_chat(workspace_id, user_id, websocket)
        except Exception:
            manager.disconnect_chat(workspace_id, user_id, websocket)


@app.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket, token: str = Query(...)):
    user_id = _authenticate_ws(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    await manager.connect_notifications(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_notifications(user_id, websocket)
    except Exception:
        manager.disconnect_notifications(user_id, websocket)


@app.websocket("/ws/board/{workspace_id}")
async def ws_board(websocket: WebSocket, workspace_id: uuid.UUID, token: str = Query(...)):
    user_id = _authenticate_ws(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    async for db in get_db():
        workspace_repo = WorkspaceRepository(db)
        member = await workspace_repo.get_member(workspace_id, user_id)
        if not member:
            await websocket.close(code=4003)
            return

        await manager.connect_board(workspace_id, user_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect_board(workspace_id, user_id, websocket)
        except Exception:
            manager.disconnect_board(workspace_id, user_id, websocket)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
