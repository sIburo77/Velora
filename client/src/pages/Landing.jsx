import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap, Shield, Users, Kanban, BarChart3, CheckCircle } from 'lucide-react';

const features = [
  { icon: Kanban, titleKey: 'landing.feature_boards', descKey: 'landing.feature_boards_desc' },
  { icon: Users, titleKey: 'landing.feature_teams', descKey: 'landing.feature_teams_desc' },
  { icon: Shield, titleKey: 'landing.feature_roles', descKey: 'landing.feature_roles_desc' },
  { icon: BarChart3, titleKey: 'landing.feature_analytics', descKey: 'landing.feature_analytics_desc' },
  { icon: Zap, titleKey: 'landing.feature_realtime', descKey: 'landing.feature_realtime_desc' },
  { icon: CheckCircle, titleKey: 'landing.feature_priority', descKey: 'landing.feature_priority_desc' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/8 dark:bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 dark:bg-cyan-500/10 blur-[100px]" />

        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
          <h1 className="text-2xl font-bold glow-text">Velora</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-sm"
            >
              {t('landing.logIn')}
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm"
            >
              {t('landing.getStarted')}
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-violet-500 dark:text-violet-300 mb-8">
            <Zap size={14} /> {t('landing.badge')}
          </div>
          <h2 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            {t('landing.title1')}<br />
            <span className="glow-text">{t('landing.title2')}</span>
          </h2>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto mb-10">
            {t('landing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base flex items-center gap-2 px-8 py-3"
            >
              {t('landing.startFree')} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-3"
            >
              {t('landing.signIn')}
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">{t('landing.featuresTitle')}</h3>
          <p className="text-content-secondary">{t('landing.featuresSubtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="card glass-hover hover:border-violet-500/20 transition-all group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition">
                <Icon size={20} className="text-violet-400" />
              </div>
              <h4 className="font-semibold mb-2">{t(titleKey)}</h4>
              <p className="text-sm text-content-secondary">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-6 pb-24">
        <div className="card text-center py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-5" />
          <h3 className="relative text-3xl font-bold mb-4">{t('landing.ctaTitle')}</h3>
          <p className="relative text-content-secondary mb-8">{t('landing.ctaSubtitle')}</p>
          <button
            onClick={() => navigate('/register')}
            className="relative btn-primary text-base px-10 py-3"
          >
            {t('landing.ctaButton')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-content-muted">
        <p>&copy; {t('landing.footer')}</p>
      </footer>
    </div>
  );
}
