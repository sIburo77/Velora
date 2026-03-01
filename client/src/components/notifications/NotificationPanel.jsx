import { useTranslation } from 'react-i18next';
import { CheckCheck, MessageSquare, AtSign, UserPlus, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const typeIcons = {
  comment: MessageSquare,
  mention: AtSign,
  invitation: UserPlus,
  deadline: Clock,
};

export default function NotificationPanel({ onClose }) {
  const { t } = useTranslation();
  const { notifications, markRead, markAllRead } = useNotifications();

  return (
    <div className="absolute left-0 top-12 w-80 max-h-96 glass rounded-2xl border border-[var(--color-border)] shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
        <button
          onClick={markAllRead}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          <CheckCheck size={14} /> {t('notifications.markAllRead')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-content-muted text-sm py-8">{t('notifications.empty')}</p>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || MessageSquare;
            return (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); }}
                className={`w-full text-left px-4 py-3 hover:bg-surface-glass transition border-b border-[var(--color-border)] last:border-0 ${
                  !n.is_read ? 'bg-violet-500/5' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-violet-500/20 text-violet-400' : 'bg-surface-glass text-content-muted'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm leading-tight ${!n.is_read ? 'font-medium' : 'text-content-secondary'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-content-muted mt-0.5 line-clamp-1">{n.body}</p>
                    )}
                    <p className="text-xs text-content-muted mt-1">
                      {new Date(n.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
