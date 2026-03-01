import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, FileText, Download, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { createChatSocket } from '../services/websocket';
import api from '../services/api';
import Loader from '../components/ui/Loader';

export default function Chat() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const fileRef = useRef(null);

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

  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !pendingFile) || !wsRef.current) return;

    let fileData = null;
    if (pendingFile) {
      setUploading(true);
      try {
        fileData = await api.uploadChatFile(currentWorkspace.id, pendingFile);
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }

    const payload = { content: text.trim() };
    if (fileData) {
      payload.file_url = fileData.file_url;
      payload.file_name = fileData.file_name;
    }
    wsRef.current.send(JSON.stringify(payload));
    setText('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  };

  const isOwnMessage = (msg) => user && msg.author_id === user.id;

  const isImageFile = (name) => {
    if (!name) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const token = localStorage.getItem('velora_token');
      const res = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
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
        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          return (
            <div key={msg.id} className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}>
              {msg.author_avatar ? (
                <img src={msg.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  own
                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                    : 'bg-gradient-to-br from-violet-500 to-blue-500'
                }`}>
                  {msg.author_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className={`max-w-[70%] ${own ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 ${own ? 'justify-end' : ''}`}>
                  <span className="text-sm font-medium">{msg.author_name || 'Unknown'}</span>
                  <span className="text-xs text-content-muted">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`mt-1 inline-block rounded-2xl px-4 py-2 ${
                  own
                    ? 'bg-violet-500/20 border border-violet-500/30 rounded-tr-md'
                    : 'bg-surface-elevated border border-[var(--color-border)] rounded-tl-md'
                }`}>
                  {msg.file_url && (
                    <div className={msg.content ? 'mb-1' : ''}>

                      {isImageFile(msg.file_name) ? (
                        <img
                          src={msg.file_url}
                          alt={msg.file_name}
                          className="max-w-[280px] max-h-[200px] rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(msg.file_url, '_blank')}
                        />
                      ) : (
                        <button
                          onClick={() => downloadFile(msg.file_url, msg.file_name)}
                          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition"
                        >
                          <FileText size={16} />
                          <span className="underline">{msg.file_name}</span>
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {msg.content && (
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {pendingFile && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <Paperclip size={14} className="text-violet-400" />
          <span className="text-sm text-content-secondary truncate">{pendingFile.name}</span>
          <button onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-content-muted hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={send} className="flex gap-3">
        <label className="btn-secondary px-3 flex items-center cursor-pointer shrink-0">
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
          <Paperclip size={18} />
        </label>
        <input
          className="input-field flex-1"
          placeholder={t('chat.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary px-6" disabled={!connected || uploading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
