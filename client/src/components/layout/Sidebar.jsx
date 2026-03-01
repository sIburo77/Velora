import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Kanban,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  X,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import NotificationBell from '../notifications/NotificationBell';
import TemplatePicker from '../workspace/TemplatePicker';

const navItems = [
  { icon: LayoutDashboard, labelKey: 'sidebar.dashboard', path: '/dashboard' },
  { icon: Kanban, labelKey: 'sidebar.board', path: '/board' },
  { icon: CalendarDays, labelKey: 'sidebar.calendar', path: '/calendar' },
  { icon: MessageCircle, labelKey: 'sidebar.chat', path: '/chat' },
  { icon: BarChart3, labelKey: 'sidebar.analytics', path: '/analytics' },
  { icon: Settings, labelKey: 'sidebar.settings', path: '/settings' },
];

export default function Sidebar({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace, reset: resetWorkspace } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const [showWs, setShowWs] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsTemplate, setNewWsTemplate] = useState('default');

  const handleLogout = () => {
    resetWorkspace();
    logout();
    navigate('/');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      await createWorkspace({ name: newWsName.trim(), template: newWsTemplate });
      setNewWsName('');
      setNewWsTemplate('default');
      setShowCreate(false);
      success(t('settings.wsCreated'));
    } catch (err) {
      error(err.message);
    }
  };

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
    localStorage.setItem('velora_lang', newLang);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-[var(--color-border)] bg-surface-sidebar
          transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold glow-text">Velora</h1>
          <div className="flex items-center gap-1">
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-glass transition md:hidden">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowWs(!showWs)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass glass-hover transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
              </div>
              <span className="text-sm font-medium truncate">{currentWorkspace?.name || t('sidebar.select')}</span>
            </div>
            <ChevronDown size={16} className={`transition text-content-muted ${showWs ? 'rotate-180' : ''}`} />
          </button>

          {showWs && (
            <div className="mt-1 rounded-xl glass border border-[var(--color-border-hover)] overflow-hidden">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { selectWorkspace(ws); setShowWs(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-glass transition ${
                    ws.id === currentWorkspace?.id ? 'text-violet-400' : 'text-content-secondary'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
              <button
                onClick={() => { setShowCreate(true); setShowWs(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-400 hover:bg-surface-glass transition border-t border-[var(--color-border)]"
              >
                <Plus size={14} /> {t('sidebar.newWorkspace')}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ icon: Icon, labelKey, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-400'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-glass'
                }`}
              >
                <Icon size={18} />
                {t(labelKey)}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-content-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-violet-400 hover:bg-violet-500/10 transition"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          </button>
          <button
            onClick={toggleLang}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-violet-400 hover:bg-violet-500/10 transition"
          >
            <Globe size={16} />
            {i18n.language === 'ru' ? 'English' : 'Русский'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={16} /> {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('settings.createWorkspace')}>
        <form onSubmit={handleCreate}>
          <input
            className="input-field mb-4"
            placeholder={t('settings.wsName')}
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            autoFocus
          />
          <TemplatePicker value={newWsTemplate} onChange={setNewWsTemplate} />
          <button type="submit" className="btn-primary w-full">{t('common.create')}</button>
        </form>
      </Modal>
    </>
  );
}
