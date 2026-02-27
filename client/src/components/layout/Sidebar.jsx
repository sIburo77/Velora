import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Kanban, label: 'Board', path: '/board' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const { success, error } = useToast();
  const [showWs, setShowWs] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      await createWorkspace({ name: newWsName.trim() });
      setNewWsName('');
      setShowCreate(false);
      success('Workspace created');
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <>
      <aside className="w-64 h-screen flex flex-col border-r border-white/5 bg-dark-50">
        {/* Logo */}
        <div className="p-6 pb-4">
          <h1 className="text-xl font-bold glow-text">Velora</h1>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowWs(!showWs)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass glass-hover transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
              </div>
              <span className="text-sm font-medium truncate">{currentWorkspace?.name || 'Select'}</span>
            </div>
            <ChevronDown size={16} className={`transition ${showWs ? 'rotate-180' : ''}`} />
          </button>

          {showWs && (
            <div className="mt-1 rounded-xl glass border border-white/10 overflow-hidden">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { selectWorkspace(ws); setShowWs(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition ${
                    ws.id === currentWorkspace?.id ? 'text-violet-400' : 'text-slate-300'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
              <button
                onClick={() => { setShowCreate(true); setShowWs(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-400 hover:bg-white/5 transition border-t border-white/5"
              >
                <Plus size={14} /> New Workspace
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
        <form onSubmit={handleCreate}>
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
    </>
  );
}
