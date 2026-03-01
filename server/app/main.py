import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import decode_access_token
from app.core.database import get_db
from app.api.routes import auth, users, workspaces, invitations, boards
from app.api.routes import comments, attachments, chat, notifications
from app.ws_manager import manager
from app.repositories.chat_repo import ChatRepository
from app.repositories.workspace_repo import WorkspaceRepository

app = FastAPI(
    title="Velora",
    description="Task Planner + CRM Board API",
    version="2.0.0",
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
                if not content:
                    continue

                msg = await chat_repo.create(workspace_id, user_id, content)
                await manager.broadcast_chat(workspace_id, {
                    "id": str(msg.id),
                    "workspace_id": str(msg.workspace_id),
                    "author_id": str(msg.author_id),
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                    "author_name": msg.author.name if msg.author else None,
                })
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


@app.get("/api/health")
async def health():
    return {"status": "ok"}
