import { useState, useRef } from 'react';
import { uploadDocument } from '../lib/apiClient';

export default function FileUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'pptx'].includes(ext)) {
      setError('Only PDF, DOCX, and PPTX files are supported.');
      return;
    }
    setError('');
    setAccepted(null);
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await uploadDocument(fd, setProgress);
      setAccepted(file.name);
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
      {/* Dropzone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          border: dragging
            ? '2px solid var(--accent)'
            : accepted
            ? '2px solid var(--success)'
            : '2px dashed var(--border-default)',
          background: dragging
            ? 'var(--accent-subtle)'
            : accepted
            ? 'var(--success-subtle)'
            : 'var(--bg-surface)',
          cursor: 'pointer',
          transition:
            'border-color var(--duration-base) var(--ease-standard), background-color var(--duration-base) var(--ease-standard)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            marginBottom: '1rem',
            transition: 'transform var(--duration-base) var(--ease-out)',
            transform: dragging ? 'translateY(-2px)' : 'none',
          }}
        >
          {accepted ? (
            /* Success checkmark SVG */
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="19" stroke="var(--success)" strokeWidth="1.5" fill="var(--success-subtle)" />
              <path
                className="check-draw"
                d="M12 20.5 L17.5 26 L28 14"
                stroke="var(--success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="6" width="24" height="28" rx="3" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" />
              <path d="M14 16 H26 M14 21 H22" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 29 L20 33 M17 31 L20 34 L23 31" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {accepted ? (
          <>
            <p style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.25rem' }}>
              {accepted}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              File accepted — processing complete
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Drop your study material here
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              PDF, DOCX, PPTX — up to 50MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* AI-processing state */}
      {uploading && (
        <div
          className="fade-in-fast"
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div className="thinking-dots" aria-label="Processing">
            <span /><span /><span />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Reading your document…
          </span>
          {/* Thin progress bar */}
          <div
            style={{
              flex: 1,
              height: '2px',
              background: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginLeft: 'auto',
            }}
          >
            <div
              className="progress-shimmer"
              style={{
                height: '100%',
                width: progress > 0 ? `${progress}%` : '40%',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          className="fade-in-fast"
          style={{
            color: 'var(--error)',
            marginTop: '0.75rem',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
