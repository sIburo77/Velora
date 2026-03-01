import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Shield } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../services/api';

export default function MemberListModal({ isOpen, onClose, workspaceId }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    api.getMembers(workspaceId).then(setMembers).catch(() => {});
  }, [isOpen, workspaceId]);

  const roleColors = {
    admin: 'text-violet-400 bg-violet-500/10',
    editor: 'text-blue-400 bg-blue-500/10',
    member: 'text-emerald-400 bg-emerald-500/10',
    viewer: 'text-content-muted bg-surface-glass',
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelected(null); }} title={t('members.title')} size="md">
      {selected ? (
        <div className="flex flex-col items-center py-4">
          {selected.avatar_url ? (
            <img src={selected.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover mb-4" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white mb-4">
              {(selected.user_name || '?')[0].toUpperCase()}
            </div>
          )}
          <h3 className="text-lg font-semibold">{selected.user_name || 'Unknown'}</h3>
          <div className="flex items-center gap-2 mt-1 text-content-secondary text-sm">
            <Mail size={14} />
            <span>{selected.user_email}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Shield size={14} className="text-violet-400" />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[selected.role] || roleColors.member}`}>
              {t(`roles.${selected.role}`)}
            </span>
          </div>
          <p className="text-xs text-content-muted mt-3">
            {t('members.joined')} {new Date(selected.joined_at).toLocaleDateString()}
          </p>
          <button
            onClick={() => setSelected(null)}
            className="btn-secondary mt-4 text-sm px-4 py-2"
          >
            {t('members.backToList')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <button
              key={m.user_id}
              onClick={() => setSelected(m)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-glass transition text-left"
            >
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {(m.user_name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user_name || 'Unknown'}</p>
                <p className="text-xs text-content-muted truncate">{m.user_email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[m.role] || roleColors.member}`}>
                {t(`roles.${m.role}`)}
              </span>
            </button>
          ))}
          {members.length === 0 && (
            <p className="text-center text-content-muted text-sm py-6">{t('members.empty')}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
