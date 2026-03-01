import { useTranslation } from 'react-i18next';
import { Kanban, Megaphone, User } from 'lucide-react';

const templates = [
  { id: 'default', icon: Kanban, columns: ['To Do', 'In Progress', 'Done'] },
  { id: 'scrum', icon: Kanban, columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'] },
  { id: 'marketing', icon: Megaphone, columns: ['Ideas', 'Planning', 'In Progress', 'Review', 'Published'] },
  { id: 'personal', icon: User, columns: ['To Do', 'In Progress', 'Done'] },
];

export default function TemplatePicker({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm text-content-secondary">{t('templates.choose')}</label>
      <div className="grid grid-cols-2 gap-2">
        {templates.map(({ id, icon: Icon, columns }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`text-left p-3 rounded-xl border transition ${
              value === id
                ? 'border-violet-500/50 bg-violet-500/10'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className={value === id ? 'text-violet-400' : 'text-content-muted'} />
              <span className="text-sm font-medium">{t(`templates.${id}`)}</span>
            </div>
            <p className="text-xs text-content-muted">{columns.join(' → ')}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
