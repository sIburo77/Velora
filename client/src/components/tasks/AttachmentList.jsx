import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
import api from '../../services/api';
import DropZone from '../ui/DropZone';

export default function AttachmentList({ workspaceId, taskId, canEdit }) {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    api.getAttachments(workspaceId, taskId).then(setAttachments).catch(() => {});
  }, [workspaceId, taskId]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await api.uploadAttachment(workspaceId, taskId, file);
      setAttachments((prev) => [attachment, ...prev]);
    } catch {}
    setUploading(false);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    await uploadFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async (id) => {
    try {
      await api.deleteAttachment(workspaceId, taskId, id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const download = async (attachment) => {
    try {
      const token = localStorage.getItem('velora_token');
      const res = await fetch(
        `/api/workspaces/${workspaceId}/board/tasks/${taskId}/attachments/${attachment.id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <DropZone onFileDrop={uploadFile} className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center gap-1">
          <Paperclip size={14} /> {t('attachments.title')}
          {attachments.length > 0 && (
            <span className="text-xs text-content-muted">({attachments.length})</span>
          )}
        </h4>
        {canEdit && (
          <label className="cursor-pointer">
            <input ref={fileRef} type="file" className="hidden" onChange={upload} />
            <span className="btn-secondary py-1 px-2 text-xs flex items-center gap-1">
              <Upload size={12} /> {uploading ? '...' : t('attachments.upload')}
            </span>
          </label>
        )}
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-glass group">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip size={14} className="text-content-muted shrink-0" />
                <span className="text-sm truncate">{a.filename}</span>
                <span className="text-xs text-content-muted shrink-0">{formatSize(a.size_bytes)}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => download(a)}
                  className="p-1 rounded hover:bg-surface-glass text-content-secondary"
                >
                  <Download size={14} />
                </button>
                {canEdit && (
                  <button
                    onClick={() => remove(a.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-content-secondary hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DropZone>
  );
}
