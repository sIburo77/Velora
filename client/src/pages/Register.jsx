import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { googleLogin } = useAuth();
  const { error, success } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.initiateRegistration({ email: email.trim() });
      success(t('auth.codeSent'));
      navigate('/verify', { state: { email: email.trim() } });
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
      <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px]" />
      <div className="absolute bottom-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold glow-text mb-2">{t('auth.createAccount')}</h1>
          <p className="text-content-secondary">{t('auth.createAccountSubtitle')}</p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {t('auth.continue')} <ArrowRight size={18} />
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
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        </div>

        <p className="text-center text-sm text-content-secondary mt-6">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition">
            {t('auth.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
