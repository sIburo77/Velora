import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { error, success } = useToast();
  const email = location.state?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    try {
      const result = await api.verifyCode({ email, code: fullCode });
      success(t('auth.codeVerified'));
      navigate('/complete-registration', {
        state: { email, registrationToken: result.registration_token },
      });
    } catch (err) {
      error(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendCode({ email });
      success(t('auth.codeResent'));
      setResendCooldown(60);
    } catch (err) {
      error(err.message);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px]" />
      <div className="absolute bottom-[20%] right-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold glow-text mb-2">{t('auth.verifyEmail')}</h1>
          <p className="text-content-secondary">
            {t('auth.codeSentTo')} <span className="text-violet-400">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex justify-center gap-3">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold input-field"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.join('').length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('auth.verifyCode')
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-violet-400 hover:text-violet-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `${t('auth.resendIn')} ${resendCooldown}${t('auth.seconds')}`
                : t('auth.resendCode')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
