import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { createChatSocket } from '../services/websocket';
import api from '../services/api';
import Loader from '../components/ui/Loader';

export default function Chat() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    api.getChatHistory(currentWorkspace.id)
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const token = localStorage.getItem('velora_token');
    if (!token) return;

    wsRef.current = createChatSocket(currentWorkspace.id, token, {
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
    });

    return () => {
      wsRef.current?.close();
    };
  }, [currentWorkspace]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ content: text.trim() }));
    setText('');
  };

  if (loading) return <Loader />;
  if (!currentWorkspace) {
    return <div className="text-center text-content-secondary mt-20">{t('chat.selectWorkspace')}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('chat.title')}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {connected ? t('chat.connected') : t('chat.disconnected')}
        </span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto glass rounded-2xl p-4 space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-content-muted text-sm py-12">{t('chat.empty')}</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {msg.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{msg.author_name || 'Unknown'}</span>
                <span className="text-xs text-content-muted">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-content-secondary mt-0.5 break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-3">
        <input
          className="input-field flex-1"
          placeholder={t('chat.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary px-6" disabled={!connected}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
