import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Kanban, BarChart3, Users, Clock, Plus, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/ui/Loader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspace();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      api.getAnalytics(currentWorkspace.id).then(setAnalytics).catch(() => {});
    }
  }, [currentWorkspace]);

  if (loading) return <Loader />;

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card text-center max-w-md">
          <Kanban size={48} className="mx-auto text-violet-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Workspace Yet</h2>
          <p className="text-slate-400 mb-6">Create your first workspace to get started</p>
          <button onClick={() => navigate('/settings')} className="btn-primary">
            <Plus size={18} className="inline mr-2" /> Create Workspace
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Tasks',
      value: analytics?.total_tasks || 0,
      icon: Kanban,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Completed',
      value: analytics?.completed_tasks || 0,
      icon: BarChart3,
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: 'Completion Rate',
      value: `${analytics?.completion_rate || 0}%`,
      icon: Clock,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Workspaces',
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
          Welcome back, <span className="glow-text">{user?.name}</span>
        </h1>
        <p className="text-slate-400">Here's what's happening in {currentWorkspace.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center opacity-80`}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/board')}
          className="card flex items-center justify-between group hover:border-violet-500/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Kanban size={24} className="text-violet-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Task Board</h3>
              <p className="text-sm text-slate-400">Manage your tasks and columns</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-500 group-hover:text-violet-400 transition" />
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
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-slate-400">View stats and completion rates</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-500 group-hover:text-blue-400 transition" />
        </button>
      </div>

      {/* Priority Distribution */}
      {analytics?.by_priority && Object.keys(analytics.by_priority).length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-4">Priority Distribution</h3>
          <div className="flex gap-4">
            {Object.entries(analytics.by_priority).map(([priority, count]) => {
              const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
              return (
                <div key={priority} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[priority] || 'bg-slate-500'}`} />
                  <span className="text-sm capitalize">{priority}</span>
                  <span className="text-sm text-slate-400">({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
