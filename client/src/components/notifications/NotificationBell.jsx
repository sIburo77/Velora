import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationBell({ onClick, active }) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-xl hover:bg-surface-glass transition ${active ? 'bg-violet-500/10 text-violet-400' : ''}`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
