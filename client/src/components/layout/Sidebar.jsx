import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft } from 'lucide-react';
import {
  AnimatedLayoutDashboard,
  AnimatedKanban,
  AnimatedCalendarDays,
  AnimatedMessageCircle,
  AnimatedBarChart,
  AnimatedActivity,
  AnimatedSettings,
  AnimatedSun,
  AnimatedMoon,
  AnimatedLogOut,
  AnimatedUsers,
  AnimatedPlus,
  AnimatedGlobe,
  AnimatedChevronDown,
} from '../icons/AnimatedIcons';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import TemplatePicker from '../workspace/TemplatePicker';
import MemberListModal from '../workspace/MemberListModal';

const navItems = [
  { icon: AnimatedLayoutDashboard, labelKey: 'sidebar.dashboard', path: '/dashboard' },
  { icon: AnimatedKanban, labelKey: 'sidebar.board', path: '/board' },
  { icon: AnimatedCalendarDays, labelKey: 'sidebar.calendar', path: '/calendar' },
  { icon: AnimatedMessageCircle, labelKey: 'sidebar.chat', path: '/chat' },
  { icon: AnimatedBarChart, labelKey: 'sidebar.analytics', path: '/analytics' },
  { icon: AnimatedActivity, labelKey: 'sidebar.activity', path: '/activity' },
  { icon: AnimatedSettings, labelKey: 'sidebar.settings', path: '/settings' },
];

export default function Sidebar({ open, onClose, desktopHidden = false, onDesktopHide = () => {} }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace, reset: resetWorkspace } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const [showWs, setShowWs] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsTemplate, setNewWsTemplate] = useState('default');
  const [themeAnimating, setThemeAnimating] = useState(false);
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [hoveredPath, setHoveredPath] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const wsListRef = useRef(null);
  const [wsHeight, setWsHeight] = useState(0);

  useEffect(() => {
    if (showWs && wsListRef.current) {
      setWsHeight(wsListRef.current.scrollHeight);
    } else {
      setWsHeight(0);
    }
  }, [showWs, workspaces]);

  useLayoutEffect(() => {
    if (!navRef.current) return;
    const activeIndex = navItems.findIndex(item => item.path === location.pathname);
    if (activeIndex === -1) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }
    const buttons = navRef.current.querySelectorAll('button');
    const btn = buttons[activeIndex];
    if (btn) {
      setIndicatorStyle({
        top: btn.offsetTop,
        height: btn.offsetHeight,
        opacity: 1,
      });
    }
  }, [location.pathname]);

  const handleToggleTheme = () => {
    setThemeAnimating(true);
    toggleTheme();
    setTimeout(() => setThemeAnimating(false), 400);
  };

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
          transition-all duration-300 ease-in-out
          md:static md:translate-x-0
          ${desktopHidden ? 'md:w-0 md:min-w-0 md:overflow-hidden md:border-r-0 md:opacity-0 md:pointer-events-none' : 'md:w-64 md:opacity-100'}
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold glow-text">Velora</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={onDesktopHide}
              className="hidden md:inline-flex p-1 rounded-lg hover:bg-surface-glass transition"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <ChevronLeft size={18} />
            </button>
            <NotificationBell onClick={() => setShowNotif(!showNotif)} active={showNotif} />
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-glass transition md:hidden">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification Panel */}
        <div className="px-4">
          <NotificationPanel open={showNotif} />
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowWs(!showWs)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass glass-hover transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              {currentWorkspace?.avatar_url ? (
                <img src={currentWorkspace.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
                </div>
              )}
              <span className="text-sm font-medium truncate">{currentWorkspace?.name || t('sidebar.select')}</span>
            </div>
            <span className={`transition text-content-muted ${showWs ? 'rotate-180' : ''}`}>
              <AnimatedChevronDown size={16} animate={showWs} />
            </span>
          </button>

          <div
            ref={wsListRef}
            className="mt-1 rounded-xl glass border border-[var(--color-border-hover)] transition-all duration-300 ease-in-out"
            style={{
              maxHeight: wsHeight,
              opacity: showWs ? 1 : 0,
              overflow: 'hidden',
            }}
          >
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
              onMouseEnter={() => setHoveredBtn('newWs')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-400 hover:bg-surface-glass transition border-t border-[var(--color-border)]"
            >
              <AnimatedPlus size={14} animate={hoveredBtn === 'newWs'} /> {t('sidebar.newWorkspace')}
            </button>
          </div>
          {currentWorkspace && (
            <button
              onClick={() => setShowMembers(true)}
              onMouseEnter={() => setHoveredBtn('members')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-xl text-sm text-content-secondary hover:text-violet-400 hover:bg-violet-500/10 transition"
            >
              <AnimatedUsers size={16} animate={hoveredBtn === 'members'} /> {t('members.title')}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 relative" ref={navRef}>
          <div
            className="absolute left-0 right-0 rounded-xl bg-violet-500/15 transition-all duration-300 ease-in-out"
            style={indicatorStyle}
          />
          {navItems.map(({ icon: Icon, labelKey, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                onMouseEnter={() => setHoveredPath(path)}
                onMouseLeave={() => setHoveredPath(null)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-glass'
                }`}
              >
                <Icon size={18} animate={hoveredPath === path} />
                {t(labelKey)}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-content-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleToggleTheme}
            onMouseEnter={() => setHoveredBtn('theme')}
            onMouseLeave={() => setHoveredBtn(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-violet-400 hover:bg-violet-500/10 transition"
          >
            <span className={`inline-flex transition-transform duration-500 ${themeAnimating ? 'rotate-[360deg] scale-125' : 'rotate-0 scale-100'}`}>
              {theme === 'dark' ? <AnimatedSun size={16} animate={hoveredBtn === 'theme'} /> : <AnimatedMoon size={16} animate={hoveredBtn === 'theme'} />}
            </span>
            {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          </button>
          <button
            onClick={toggleLang}
            onMouseEnter={() => setHoveredBtn('lang')}
            onMouseLeave={() => setHoveredBtn(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-violet-400 hover:bg-violet-500/10 transition"
          >
            <AnimatedGlobe size={16} animate={hoveredBtn === 'lang'} />
            {i18n.language === 'ru' ? 'English' : 'Русский'}
          </button>
          <button
            onClick={handleLogout}
            onMouseEnter={() => setHoveredBtn('logout')}
            onMouseLeave={() => setHoveredBtn(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-secondary hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <AnimatedLogOut size={16} animate={hoveredBtn === 'logout'} /> {t('sidebar.logout')}
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

      <MemberListModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        workspaceId={currentWorkspace?.id}
      />
    </>
  );
}
