import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Users, Kanban, BarChart3, CheckCircle } from 'lucide-react';

const features = [
  { icon: Kanban, title: 'Trello-style Boards', desc: 'Organize tasks with drag-and-drop columns and cards' },
  { icon: Users, title: 'Team Workspaces', desc: 'Create workspaces and invite your team members' },
  { icon: Shield, title: 'Role-based Access', desc: 'Control who can manage workspace settings' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track completion rates and task distribution' },
  { icon: Zap, title: 'Real-time Updates', desc: 'Instant updates across your team' },
  { icon: CheckCircle, title: 'Priority System', desc: 'Set priorities, deadlines and track completion' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />

        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
          <h1 className="text-2xl font-bold glow-text">Velora</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-sm"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm"
            >
              Get Started
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-violet-300 mb-8">
            <Zap size={14} /> Now in beta — free for all teams
          </div>
          <h2 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            Plan, Track &<br />
            <span className="glow-text">Ship Together</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Velora is a modern task planner and CRM board built for teams.
            Organize your workflow with workspaces, Trello-style boards,
            and powerful analytics.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base flex items-center gap-2 px-8 py-3"
            >
              Start Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-3"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Everything your team needs</h3>
          <p className="text-slate-400">Powerful features wrapped in a beautiful interface</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card glass-hover hover:border-violet-500/20 transition-all group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition">
                <Icon size={20} className="text-violet-400" />
              </div>
              <h4 className="font-semibold mb-2">{title}</h4>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-6 pb-24">
        <div className="card text-center py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-5" />
          <h3 className="relative text-3xl font-bold mb-4">Ready to boost your productivity?</h3>
          <p className="relative text-slate-400 mb-8">Join teams already using Velora to ship faster</p>
          <button
            onClick={() => navigate('/register')}
            className="relative btn-primary text-base px-10 py-3"
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>&copy; 2026 Velora. Built for teams that ship.</p>
      </footer>
    </div>
  );
}
