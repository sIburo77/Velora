import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { completeRegistration } = useAuth();
  const { error, success } = useToast();

  const email = location.state?.email;
  const registrationToken = location.state?.registrationToken;

  const [form, setForm] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !registrationToken) {
      navigate('/register');
    }
  }, [email, registrationToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await completeRegistration({
        email,
        name: form.name,
        password: form.password,
        registration_token: registrationToken,
      });
      success(t('auth.accountCreated'));
      navigate('/dashboard');
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email || !registrationToken) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px]" />
      <div className="absolute bottom-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold glow-text mb-2">{t('auth.almostDone')}</h1>
          <p className="text-content-secondary">{t('auth.completeProfile')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('auth.name')}</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder={t('auth.yourName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
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
                placeholder={t('auth.minChars')}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
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
                <UserPlus size={18} /> {t('auth.signUp')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
