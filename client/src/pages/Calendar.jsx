import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';
import { SkeletonCalendar } from '../components/ui/Skeleton';

const priorityDots = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

export default function Calendar() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date());

  const year = date.getFullYear();
  const month = date.getMonth();

  useEffect(() => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getCalendarTasks(currentWorkspace.id, year, month + 1)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentWorkspace, year, month]);

  const prev = () => setDate(new Date(year, month - 1, 1));
  const next = () => setDate(new Date(year, month + 1, 1));

  const tasksByDay = useMemo(() => {
    const result = {};
    tasks.forEach((t) => {
      if (!t.deadline) return;
      const d = new Date(t.deadline).getDate();
      if (!result[d]) result[d] = [];
      result[d].push(t);
    });
    return result;
  }, [tasks]);

  if (loading) return <SkeletonCalendar />;
  if (!currentWorkspace) {
    return <div className="text-center text-content-secondary mt-20">{t('calendar.selectWorkspace')}</div>;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
  const cells = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (d) =>
    d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const weekDays = [
    t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
    t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun'),
  ];

  const monthNames = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'),
    t('calendar.april'), t('calendar.may'), t('calendar.june'),
    t('calendar.july'), t('calendar.august'), t('calendar.september'),
    t('calendar.october'), t('calendar.november'), t('calendar.december'),
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
        <div className="flex items-center gap-4">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-surface-glass transition">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={next} className="p-2 rounded-xl hover:bg-surface-glass transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px glass rounded-2xl overflow-hidden">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-content-muted py-3 bg-surface-elevated">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[100px] p-2 border-t border-[var(--color-border)] ${
              day ? 'bg-surface-elevated' : 'bg-surface-sidebar'
            }`}
          >
            {day && (
              <>
                <span className={`text-sm font-medium inline-flex w-7 h-7 items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-violet-500 text-white' : 'text-content-secondary'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {(tasksByDay[day] || []).slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        task.is_completed
                          ? 'line-through text-content-muted'
                          : 'text-content-primary'
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${priorityDots[task.priority]}`} />
                      {task.title}
                    </div>
                  ))}
                  {(tasksByDay[day] || []).length > 3 && (
                    <span className="text-xs text-content-muted">+{tasksByDay[day].length - 3}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
