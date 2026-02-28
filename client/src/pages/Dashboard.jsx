import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Kanban, BarChart3, Users, Clock, Plus, ArrowRight, Mail, Check, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Loader from '../components/ui/Loader';
import Modal from '../components/ui/Modal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentWorkspace, workspaces, fetchWorkspaces, createWorkspace } = useWorkspace();
  const { success, error } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      await createWorkspace({ name: newWsName.trim() });
      setNewWsName('');
      setShowCreate(false);
      success(t('settings.wsCreated'));
    } catch (err) {
      error(err.message);
    }
  };

  useEffect(() => {
    fetchWorkspaces().finally(() => setLoading(false));
    api.getMyInvitations().then(setPendingInvitations).catch(() => {});
  }, []);

  const acceptInvite = async (token) => {
    try {
      await api.acceptInvitation({ token });
      setPendingInvitations(prev => prev.filter(i => i.token !== token));
      await fetchWorkspaces();
      success(t('dashboard.invitationAccepted'));
    } catch (err) {
      error(err.message);
    }
  };

  const declineInvite = async (token) => {
    try {
      await api.declineInvitation({ token });
      setPendingInvitations(prev => prev.filter(i => i.token !== token));
      success(t('dashboard.invitationDeclined'));
    } catch (err) {
      error(err.message);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      api.getAnalytics(currentWorkspace.id).then(setAnalytics).catch(() => {});
    }
  }, [currentWorkspace]);

  if (loading) return <Loader />;

  const InvitationBanner = () => {
    if (pendingInvitations.length === 0) return null;
    return (
      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-medium text-content-secondary flex items-center gap-2">
          <Mail size={16} /> {t('dashboard.pendingInvitations')}
        </h3>
        {pendingInvitations.map((inv) => (
          <div key={inv.id} className="card flex items-center justify-between py-4 border-violet-500/30">
            <div>
              <p className="font-medium">
                {t('dashboard.invitedTo')} <span className="text-violet-400">{inv.workspace_name || 'a workspace'}</span>
              </p>
              <p className="text-sm text-content-muted">
                {t('dashboard.expires')} {new Date(inv.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => acceptInvite(inv.token)} className="btn-primary py-2 text-sm flex items-center gap-1">
                <Check size={16} /> {t('common.accept')}
              </button>
              <button onClick={() => declineInvite(inv.token)} className="btn-secondary py-2 text-sm flex items-center gap-1">
                <X size={16} /> {t('common.decline')}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!currentWorkspace) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <InvitationBanner />
        <div className="card text-center">
          <Kanban size={48} className="mx-auto text-violet-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('dashboard.noWorkspace')}</h2>
          <p className="text-content-secondary mb-6">{t('dashboard.noWorkspaceDesc')}</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} className="inline mr-2" /> {t('dashboard.createWorkspace')}
          </button>
        </div>
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('settings.createWorkspace')}>
          <form onSubmit={handleCreate}>
            <input
              className="input-field mb-4"
              placeholder={t('settings.wsName')}
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary w-full">
              {t('common.create')}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  const stats = [
    {
      label: t('dashboard.totalTasks'),
      value: analytics?.total_tasks || 0,
      icon: Kanban,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: t('dashboard.completed'),
      value: analytics?.completed_tasks || 0,
      icon: BarChart3,
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: t('dashboard.completionRate'),
      value: `${analytics?.completion_rate || 0}%`,
      icon: Clock,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: t('dashboard.workspaces'),
      value: workspaces.length,
      icon: Users,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {t('dashboard.welcomeBack')} <span className="glow-text">{user?.name}</span>
        </h1>
        <p className="text-content-secondary">{t('dashboard.happeningIn')} {currentWorkspace.name}</p>
      </div>

      <InvitationBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card group hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center opacity-80`}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-content-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/board')}
          className="card flex items-center justify-between group hover:border-violet-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Kanban size={24} className="text-violet-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">{t('dashboard.taskBoard')}</h3>
              <p className="text-sm text-content-secondary">{t('dashboard.taskBoardDesc')}</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-content-muted group-hover:text-violet-400 transition" />
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="card flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 size={24} className="text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">{t('dashboard.analytics')}</h3>
              <p className="text-sm text-content-secondary">{t('dashboard.analyticsDesc')}</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-content-muted group-hover:text-blue-400 transition" />
        </button>
      </div>

      {/* Priority Distribution */}
      {analytics?.by_priority && Object.keys(analytics.by_priority).length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-4">{t('dashboard.priorityDistribution')}</h3>
          <div className="flex gap-4">
            {Object.entries(analytics.by_priority).map(([priority, count]) => {
              const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
              return (
                <div key={priority} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[priority] || 'bg-slate-500'}`} />
                  <span className="text-sm capitalize">{priority}</span>
                  <span className="text-sm text-content-secondary">({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
