import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ workspaceId, taskId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    api.getComments(workspaceId, taskId).then(setComments).catch(() => {});
  }, [workspaceId, taskId]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const comment = await api.createComment(workspaceId, taskId, { content: text.trim() });
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch {}
    setLoading(false);
  };

  const remove = async (id) => {
    try {
      await api.deleteComment(workspaceId, taskId, id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-4">
      <h4 className="text-sm font-medium mb-3">{t('comments.title')}</h4>
      <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {c.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{c.author_name || 'Unknown'}</span>
                <span className="text-xs text-content-muted">{new Date(c.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {c.author_id === user?.id && (
                  <button
                    onClick={() => remove(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-content-muted hover:text-red-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sm text-content-secondary mt-0.5 break-words">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder={t('comments.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary py-2 px-3">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
