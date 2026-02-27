import { useState, useEffect } from 'react';
import { User, Building, Users, Mail, Trash2, Save, UserMinus, Send, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
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
      success('Profile updated');
    } catch (err) {
      error(err.message);
    }
  };

  const saveWorkspaceName = async () => {
    if (!currentWorkspace) return;
    try {
      await updateWorkspace(currentWorkspace.id, { name: wsName });
      success('Workspace renamed');
    } catch (err) {
      error(err.message);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(currentWorkspace.id);
      setShowDeleteWs(false);
      success('Workspace deleted');
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
      success('Invitation sent');
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
      success('Invitation accepted! Reload to see the workspace.');
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
      success('Workspace created');
    } catch (err) {
      error(err.message);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isOwner = currentWorkspace?.role === 'owner';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User size={18} className="text-violet-400" /> Profile
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <button onClick={saveProfile} className="btn-primary flex items-center gap-2">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input className="input-field opacity-50" value={user?.email || ''} disabled />
          </div>
        </div>
      </div>

      {/* Accept Invitation */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Mail size={18} className="text-cyan-400" /> Accept Invitation
        </h2>
        <form onSubmit={handleAcceptInvitation} className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Paste invitation token"
            value={acceptToken}
            onChange={(e) => setAcceptToken(e.target.value)}
          />
          <button type="submit" className="btn-primary">Accept</button>
        </form>
      </div>

      {/* Workspace */}
      {currentWorkspace && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Building size={18} className="text-blue-400" /> Workspace
              </h2>
              <button onClick={() => setShowNewWs(true)} className="btn-secondary py-1.5 text-sm">
                + New
              </button>
            </div>
            {isOwner && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                    />
                    <button onClick={saveWorkspaceName} className="btn-primary flex items-center gap-2">
                      <Save size={16} /> Save
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteWs(true)}
                  className="btn-danger text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete Workspace
                </button>
              </div>
            )}
            {!isOwner && (
              <p className="text-sm text-slate-400">You are a member of this workspace. Only the owner can edit settings.</p>
            )}
          </div>

          {/* Members */}
          <div className="card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={18} className="text-emerald-400" /> Members
            </h2>
            <div className="space-y-2 mb-4">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                      {m.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{m.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'owner' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400'
                    }`}>
                      {m.role}
                    </span>
                    {isOwner && m.role !== 'owner' && (
                      <button
                        onClick={() => removeMember(currentWorkspace.id, m.user_id)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite */}
            {isOwner && (
              <>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Invite by email</h3>
                <form onSubmit={sendInvitation} className="flex gap-2 mb-4">
                  <input
                    className="input-field flex-1"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send size={16} /> Invite
                  </button>
                </form>

                {/* Pending Invitations */}
                {invitations.filter(i => i.status === 'pending').length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Pending Invitations</h3>
                    <div className="space-y-2">
                      {invitations.filter(i => i.status === 'pending').map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-dark-100">
                          <div>
                            <p className="text-sm">{inv.email}</p>
                            <p className="text-xs text-slate-500">
                              Expires: {new Date(inv.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToken(inv.token)}
                            className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                          >
                            {copiedToken === inv.token ? <Check size={12} /> : <Copy size={12} />}
                            {copiedToken === inv.token ? 'Copied' : 'Token'}
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
        <h2 className="font-semibold mb-4 text-red-400">Danger Zone</h2>
        <button
          onClick={() => setShowDeleteAccount(true)}
          className="btn-danger text-sm flex items-center gap-2"
        >
          <Trash2 size={16} /> Delete Account
        </button>
      </div>

      {/* Delete Workspace Modal */}
      <Modal isOpen={showDeleteWs} onClose={() => setShowDeleteWs(false)} title="Delete Workspace">
        <p className="text-slate-400 mb-4">
          This will permanently delete <strong>{currentWorkspace?.name}</strong> and all its data. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={handleDeleteWorkspace} className="btn-danger flex-1">Delete</button>
          <button onClick={() => setShowDeleteWs(false)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title="Delete Account">
        <p className="text-slate-400 mb-4">
          This will permanently delete your account and all associated data. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={handleDeleteAccount} className="btn-danger flex-1">Delete</button>
          <button onClick={() => setShowDeleteAccount(false)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>

      {/* Create Workspace Modal */}
      <Modal isOpen={showNewWs} onClose={() => setShowNewWs(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace}>
          <input
            className="input-field mb-4"
            placeholder="Workspace name"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary w-full">Create</button>
        </form>
      </Modal>
    </div>
  );
}
