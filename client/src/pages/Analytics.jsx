import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle, Clock, Layers, Flag, TrendingUp, Users } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';
import { SkeletonStat, SkeletonLine } from '../components/ui/Skeleton';

export default function Analytics() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getAnalytics(currentWorkspace.id)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentWorkspace]);

  const maxColCount = useMemo(() => data ? Math.max(...Object.values(data.by_column), 1) : 1, [data]);
  const totalPriority = useMemo(() => data ? (Object.values(data.by_priority).reduce((a, b) => a + b, 0) || 1) : 1, [data]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-32 rounded bg-surface-elevated animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <div className="card mb-6">
          <SkeletonLine className="h-4 w-40 mb-4" />
          <SkeletonLine className="h-4 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <SkeletonLine className="h-4 w-36" />
            <SkeletonLine className="h-2 w-full rounded-full" />
            <SkeletonLine className="h-2 w-3/4 rounded-full" />
            <SkeletonLine className="h-2 w-1/2 rounded-full" />
          </div>
          <div className="card space-y-3">
            <SkeletonLine className="h-4 w-36" />
            <SkeletonLine className="h-2 w-full rounded-full" />
            <SkeletonLine className="h-2 w-2/3 rounded-full" />
            <SkeletonLine className="h-2 w-1/3 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace || !data) return <div className="text-content-secondary text-center mt-20">{t('analytics.noData')}</div>;

  const priorityLabels = { high: t('analytics.high'), medium: t('analytics.medium'), low: t('analytics.low') };
  const priorityColors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('analytics.title')}</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Layers size={20} className="text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.total_tasks}</p>
              <p className="text-sm text-content-secondary">{t('analytics.totalTasks')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.completed_tasks}</p>
              <p className="text-sm text-content-secondary">{t('analytics.completed')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.completion_rate}%</p>
              <p className="text-sm text-content-secondary">{t('analytics.completionRate')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-violet-400" /> {t('analytics.overallProgress')}
        </h3>
        <div className="w-full h-4 rounded-full bg-surface-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${data.completion_rate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-content-secondary">
          <span>{data.completed_tasks} {t('analytics.completedCount')}</span>
          <span>{data.total_tasks - data.completed_tasks} {t('analytics.remaining')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Column */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" /> {t('analytics.byColumn')}
          </h3>
          {Object.keys(data.by_column).length === 0 ? (
            <p className="text-sm text-content-muted">{t('analytics.noColumns')}</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.by_column).map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-content-primary">{name}</span>
                    <span className="text-content-secondary">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                      style={{ width: `${(count / maxColCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Priority */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Flag size={18} className="text-amber-400" /> {t('analytics.byPriority')}
          </h3>
          {Object.keys(data.by_priority).length === 0 ? (
            <p className="text-sm text-content-muted">{t('analytics.noTasks')}</p>
          ) : (
            <div className="space-y-4">
              {['high', 'medium', 'low'].map((p) => {
                const count = data.by_priority[p] || 0;
                const pct = Math.round((count / totalPriority) * 100);
                return (
                  <div key={p}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[p]}`} />
                        {priorityLabels[p]}
                      </span>
                      <span className="text-content-secondary">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className={`h-full rounded-full ${priorityColors[p]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Performance */}
      {data.by_member?.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-violet-400" /> {t('analytics.teamPerformance')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.by_member.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-[var(--color-border)]">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {m.user_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.user_name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-content-secondary mt-0.5">
                    <span>{m.tasks_created} {t('analytics.tasksCreated')}</span>
                    <span>{m.tasks_completed} {t('analytics.tasksCompleted')}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-glass mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                      style={{ width: `${m.completion_rate}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 shrink-0">{m.completion_rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
