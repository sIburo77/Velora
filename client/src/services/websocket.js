const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

export function createChatSocket(workspaceId, token, { onMessage, onOpen, onClose }) {
  const ws = new WebSocket(`${WS_BASE}/ws/chat/${workspaceId}?token=${token}`);
  ws.onopen = () => onOpen?.();
  ws.onclose = () => onClose?.();
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage?.(data);
    } catch {}
  };
  return ws;
}

export function createNotificationSocket(token, { onMessage, onOpen, onClose }) {
  const ws = new WebSocket(`${WS_BASE}/ws/notifications?token=${token}`);
  ws.onopen = () => onOpen?.();
  ws.onclose = () => onClose?.();
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage?.(data);
    } catch {}
  };
  return ws;
}
