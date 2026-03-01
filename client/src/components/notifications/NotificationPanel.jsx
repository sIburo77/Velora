import { useTranslation } from 'react-i18next';
import { CheckCheck, MessageSquare, AtSign, UserPlus, Clock, Kanban } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const typeIcons = {
  comment: MessageSquare,
  mention: AtSign,
  invitation: UserPlus,
  deadline: Clock,
  task: Kanban,
};

export default function NotificationPanel({ open }) {
  const { t } = useTranslation();
  const { notifications, markRead, markAllRead } = useNotifications();

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        open ? 'max-h-80 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
      }`}
    >
      <div className="glass rounded-xl border border-[var(--color-border)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-xs">{t('notifications.title')}</h3>
          <button
            onClick={markAllRead}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            <CheckCheck size={12} /> {t('notifications.markAllRead')}
          </button>
        </div>
        <div className="overflow-y-auto max-h-60">
          {notifications.length === 0 ? (
            <p className="text-center text-content-muted text-xs py-6">{t('notifications.empty')}</p>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || MessageSquare;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-surface-glass transition border-b border-[var(--color-border)] last:border-0 ${
                    !n.is_read ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      !n.is_read ? 'bg-violet-500/20 text-violet-400' : 'bg-surface-glass text-content-muted'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-tight ${!n.is_read ? 'font-medium' : 'text-content-secondary'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-content-muted mt-0.5 line-clamp-1">{n.body}</p>
                      )}
                      <p className="text-[11px] text-content-muted mt-0.5">
                        {new Date(n.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
