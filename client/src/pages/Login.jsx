import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const { error, success } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      success(t('auth.welcomeBackToast'));
      navigate('/dashboard');
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      success(t('auth.welcomeBackToast'));
      navigate('/dashboard');
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold glow-text mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-content-secondary">{t('auth.signInSubtitle')}</p>
        </div>

        <div className="card space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-content-secondary mb-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-content-secondary mb-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder={t('auth.enterPassword')}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} /> {t('auth.signIn')}
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-bg-card)] text-content-muted">{t('auth.or')}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => error(t('auth.googleError'))}
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        </div>

        <p className="text-center text-sm text-content-secondary mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
