import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';

export default function DropZone({ children, onFileDrop, className = '' }) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const dragCounter = { current: 0 };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  }, [onFileDrop]);

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {dragging && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-violet-500/10 backdrop-blur-sm border-2 border-dashed border-violet-500/50 rounded-2xl">
          <div className="flex flex-col items-center gap-2 text-violet-400">
            <Upload size={32} />
            <span className="text-sm font-medium">{t('common.dropFileHere')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
