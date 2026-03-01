import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building, Users, Mail, Trash2, Save, UserMinus, Send, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const {
    currentWorkspace, workspaces, updateWorkspace, deleteWorkspace,
    fetchMembers, members, removeMember, createWorkspace,
  } = useWorkspace();
  const { success, error } = useToast();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [showDeleteWs, setShowDeleteWs] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showNewWs, setShowNewWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [acceptToken, setAcceptToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    setWsName(currentWorkspace?.name || '');
    if (currentWorkspace) {
      fetchMembers(currentWorkspace.id);
      api.getInvitations(currentWorkspace.id).then(setInvitations).catch(() => {});
    }
  }, [currentWorkspace]);

  const saveProfile = async () => {
    try {
      const updated = await api.updateProfile({ name: profileName });
      updateUser(updated);
      success(t('settings.profileUpdated'));
    } catch (err) {
      error(err.message);
    }
  };

  const saveWorkspaceName = async () => {
    if (!currentWorkspace) return;
    try {
      await updateWorkspace(currentWorkspace.id, { name: wsName });
      success(t('settings.wsRenamed'));
    } catch (err) {
      error(err.message);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(currentWorkspace.id);
      setShowDeleteWs(false);
      success(t('settings.wsDeleted'));
    } catch (err) {
      error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      error(err.message);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const inv = await api.createInvitation(currentWorkspace.id, { email: inviteEmail.trim() });
      setInviteEmail('');
      setInvitations([...invitations, inv]);
      success(t('settings.invitationSent'));
    } catch (err) {
      error(err.message);
    }
  };

  const handleAcceptInvitation = async (e) => {
    e.preventDefault();
    if (!acceptToken.trim()) return;
    try {
      await api.acceptInvitation({ token: acceptToken.trim() });
      setAcceptToken('');
      success(t('settings.invitationAccepted'));
      window.location.reload();
    } catch (err) {
      error(err.message);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      await createWorkspace({ name: newWsName.trim() });
      setNewWsName('');
      setShowNewWs(false);
      success(t('settings.wsCreated'));
    } catch (err) {
      error(err.message);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isAdmin = currentWorkspace?.role === 'admin';

  const changeRole = async (userId, role) => {
    try {
      await api.updateMemberRole(currentWorkspace.id, userId, { role });
      await fetchMembers(currentWorkspace.id);
      success(t('settings.roleUpdated'));
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User size={18} className="text-violet-400" /> {t('settings.profile')}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('auth.name')}</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <button onClick={saveProfile} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {t('common.save')}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('auth.email')}</label>
            <input className="input-field opacity-50" value={user?.email || ''} disabled />
          </div>
        </div>
      </div>

      {/* Accept Invitation */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Mail size={18} className="text-cyan-400" /> {t('settings.acceptInvitation')}
        </h2>
        <form onSubmit={handleAcceptInvitation} className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder={t('settings.pasteToken')}
            value={acceptToken}
            onChange={(e) => setAcceptToken(e.target.value)}
          />
          <button type="submit" className="btn-primary">{t('common.accept')}</button>
        </form>
      </div>

      {/* Workspace */}
      {currentWorkspace && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Building size={18} className="text-blue-400" /> {t('settings.workspace')}
              </h2>
              <button onClick={() => setShowNewWs(true)} className="btn-secondary py-1.5 text-sm">
                + {t('settings.newWorkspace')}
              </button>
            </div>
            {isAdmin && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-content-secondary mb-1">{t('auth.name')}</label>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                    />
                    <button onClick={saveWorkspaceName} className="btn-primary flex items-center gap-2">
                      <Save size={16} /> {t('common.save')}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteWs(true)}
                  className="btn-danger text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} /> {t('settings.deleteWorkspace')}
                </button>
              </div>
            )}
            {!isAdmin && (
              <p className="text-sm text-content-secondary">{t('settings.memberOnly')}</p>
            )}
          </div>

          {/* Members */}
          <div className="card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={18} className="text-emerald-400" /> {t('settings.members')}
            </h2>
            <div className="space-y-2 mb-4">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-glass">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                      {m.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user_name || 'Unknown'}</p>
                      <p className="text-xs text-content-muted">{m.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && m.role !== 'admin' ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.user_id, e.target.value)}
                        className="text-xs rounded-lg bg-surface-glass border border-[var(--color-border)] px-2 py-1"
                      >
                        <option value="viewer">{t('settings.viewer')}</option>
                        <option value="member">{t('settings.member')}</option>
                        <option value="editor">{t('settings.editor')}</option>
                        <option value="admin">{t('settings.admin')}</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.role === 'admin' ? 'bg-violet-500/20 text-violet-400' : 'bg-surface-glass text-content-secondary'
                      }`}>
                        {m.role}
                      </span>
                    )}
                    {isAdmin && m.role !== 'admin' && (
                      <button
                        onClick={() => removeMember(currentWorkspace.id, m.user_id)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-content-secondary hover:text-red-400 transition"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite */}
            {isAdmin && (
              <>
                <h3 className="text-sm font-medium text-content-secondary mb-2">{t('settings.inviteByEmail')}</h3>
                <form onSubmit={sendInvitation} className="flex gap-2 mb-4">
                  <input
                    className="input-field flex-1"
                    type="email"
                    placeholder={t('settings.userEmail')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send size={16} /> {t('common.invite')}
                  </button>
                </form>

                {/* Pending Invitations */}
                {invitations.filter(i => i.status === 'pending').length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-content-secondary mb-2">{t('settings.pendingInvitations')}</h3>
                    <div className="space-y-2">
                      {invitations.filter(i => i.status === 'pending').map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-elevated">
                          <div>
                            <p className="text-sm">{inv.email}</p>
                            <p className="text-xs text-content-muted">
                              {t('dashboard.expires')}: {new Date(inv.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToken(inv.token)}
                            className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                          >
                            {copiedToken === inv.token ? <Check size={12} /> : <Copy size={12} />}
                            {copiedToken === inv.token ? t('settings.copied') : t('settings.token')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Danger Zone */}
      <div className="card border-red-500/20">
        <h2 className="font-semibold mb-4 text-red-400">{t('settings.dangerZone')}</h2>
        <button
          onClick={() => setShowDeleteAccount(true)}
          className="btn-danger text-sm flex items-center gap-2"
        >
          <Trash2 size={16} /> {t('settings.deleteAccount')}
        </button>
      </div>

      {/* Delete Workspace Modal */}
      <Modal isOpen={showDeleteWs} onClose={() => setShowDeleteWs(false)} title={t('settings.deleteWorkspace')}>
        <p className="text-content-secondary mb-4">
          {t('settings.deleteWsConfirm', { name: currentWorkspace?.name })}
        </p>
        <div className="flex gap-2">
          <button onClick={handleDeleteWorkspace} className="btn-danger flex-1">{t('common.delete')}</button>
          <button onClick={() => setShowDeleteWs(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title={t('settings.deleteAccount')}>
        <p className="text-content-secondary mb-4">
          {t('settings.deleteAccountConfirm')}
        </p>
        <div className="flex gap-2">
          <button onClick={handleDeleteAccount} className="btn-danger flex-1">{t('common.delete')}</button>
          <button onClick={() => setShowDeleteAccount(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
        </div>
      </Modal>

      {/* Create Workspace Modal */}
      <Modal isOpen={showNewWs} onClose={() => setShowNewWs(false)} title={t('settings.createWorkspace')}>
        <form onSubmit={handleCreateWorkspace}>
          <input
            className="input-field mb-4"
            placeholder={t('settings.wsName')}
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary w-full">{t('common.create')}</button>
        </form>
      </Modal>
    </div>
  );
}
