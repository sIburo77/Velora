import uuid
import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # workspace_id -> list of (user_id, websocket)
        self.chat_connections: dict[uuid.UUID, list[tuple[uuid.UUID, WebSocket]]] = defaultdict(list)
        # user_id -> list of websockets
        self.notification_connections: dict[uuid.UUID, list[WebSocket]] = defaultdict(list)

    async def connect_chat(self, workspace_id: uuid.UUID, user_id: uuid.UUID, ws: WebSocket):
        await ws.accept()
        self.chat_connections[workspace_id].append((user_id, ws))

    def disconnect_chat(self, workspace_id: uuid.UUID, user_id: uuid.UUID, ws: WebSocket):
        self.chat_connections[workspace_id] = [
            (uid, w) for uid, w in self.chat_connections[workspace_id]
            if w != ws
        ]
        if not self.chat_connections[workspace_id]:
            del self.chat_connections[workspace_id]

    async def broadcast_chat(self, workspace_id: uuid.UUID, message: dict):
        connections = self.chat_connections.get(workspace_id, [])
        dead = []
        for uid, ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append((uid, ws))
        for item in dead:
            self.chat_connections[workspace_id].remove(item)

    async def connect_notifications(self, user_id: uuid.UUID, ws: WebSocket):
        await ws.accept()
        self.notification_connections[user_id].append(ws)

    def disconnect_notifications(self, user_id: uuid.UUID, ws: WebSocket):
        self.notification_connections[user_id] = [
            w for w in self.notification_connections[user_id] if w != ws
        ]
        if not self.notification_connections[user_id]:
            del self.notification_connections[user_id]

    async def send_notification(self, user_id: uuid.UUID, notification: dict):
        connections = self.notification_connections.get(user_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_json(notification)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.notification_connections[user_id].remove(ws)


manager = ConnectionManager()
