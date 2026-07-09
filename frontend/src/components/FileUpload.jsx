import { useState, useRef } from 'react';
import { uploadDocument } from '../lib/apiClient';

export default function FileUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'pptx'].includes(ext)) {
      setError('Only PDF, DOCX, and PPTX files are supported.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await uploadDocument(fd, setProgress);
      onUploadSuccess && onUploadSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div
        className="glass cursor-pointer transition-all duration-300"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          border: dragging ? '2px dashed #6366f1' : '2px dashed rgba(255,255,255,0.1)',
          background: dragging ? 'rgba(99,102,241,0.06)' : undefined,
          borderRadius: '16px',
        }}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
        <p className="font-semibold" style={{ color: 'var(--text)', marginBottom: '0.35rem' }}>
          Drop your study material here
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          PDF, DOCX, PPTX — up to 50MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {uploading && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>Processing document…</span><span>{progress}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>⚠ {error}</p>
      )}
    </div>
  );
}
