import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Plus, Trash2, Edit3, CheckCircle, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';

const actionIcons = {
  created: <Plus size={14} className="text-emerald-400" />,
  updated: <Edit3 size={14} className="text-blue-400" />,
  completed: <CheckCircle size={14} className="text-violet-400" />,
  deleted: <Trash2 size={14} className="text-red-400" />,
  moved: <ArrowRight size={14} className="text-amber-400" />,
};

const actionColors = {
  created: 'bg-emerald-500/10 border-emerald-500/20',
  updated: 'bg-blue-500/10 border-blue-500/20',
  completed: 'bg-violet-500/10 border-violet-500/20',
  deleted: 'bg-red-500/10 border-red-500/20',
  moved: 'bg-amber-500/10 border-amber-500/20',
};

export default function Activity() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (offset = 0) => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getActivityLogs(currentWorkspace.id, 50, offset);
      if (offset === 0) {
        setLogs(data);
      } else {
        setLogs((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 50);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setLogs([]);
    fetchLogs(0);
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-content-muted">{t('activity.selectWorkspace')}</p>
      </div>
    );
  }

  const grouped = useMemo(() => {
    const groups = {};
    for (const log of logs) {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    }
    return groups;
  }, [logs]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-violet-500/10">
          <History size={22} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('activity.title')}</h1>
          <p className="text-sm text-content-muted">{currentWorkspace.name}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-surface-glass shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-glass rounded w-3/4" />
                <div className="h-3 bg-surface-glass rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <History size={48} className="mx-auto mb-4 text-content-muted opacity-30" />
          <p className="text-content-muted">{t('activity.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-0 z-10 mb-3">
                <span className="text-xs font-medium text-content-muted bg-[var(--color-bg)] px-2 py-1 rounded-lg">
                  {date}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${actionColors[log.action] || 'bg-surface-glass border-[var(--color-border)]'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {log.user_avatar ? (
                        <img src={log.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {(log.user_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.user_name || t('activity.unknown')}</span>
                        {' '}
                        <span className="text-content-secondary">
                          {t(`activity.${log.action}`, { defaultValue: log.action })}
                        </span>
                        {' '}
                        <span className="text-content-secondary">{t(`activity.target_${log.target_type}`, { defaultValue: log.target_type })}</span>
                        {log.target_name && (
                          <>
                            {' '}
                            <span className="font-medium">«{log.target_name}»</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-content-muted mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">{actionIcons[log.action]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => fetchLogs(logs.length)}
              className="w-full py-3 text-sm text-violet-400 hover:bg-violet-500/10 rounded-xl transition"
            >
              {t('activity.loadMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
