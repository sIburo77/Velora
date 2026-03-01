import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { createNotificationSocket } from '../services/websocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {}
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();

    const token = localStorage.getItem('velora_token');
    if (!token) return;

    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      ws = createNotificationSocket(token, {
        onMessage: (data) => {
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
        onClose: () => {
          reconnectTimeout = setTimeout(connect, 5000);
        },
      });
    }
    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [user]);

  const markRead = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
