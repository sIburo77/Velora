import { X } from 'lucide-react';

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-50 w-full ${sizes[size] || sizes.md} mx-4 glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-glass transition">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
