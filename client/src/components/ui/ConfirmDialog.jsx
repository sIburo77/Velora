import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  const { t } = useTranslation();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-50 w-full max-w-sm mx-4 glass rounded-2xl p-6 transition-all duration-200 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-content-secondary mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="btn-danger py-2 px-4 text-sm"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
