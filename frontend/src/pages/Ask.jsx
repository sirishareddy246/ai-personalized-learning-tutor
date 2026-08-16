import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuestionBox from '../components/QuestionBox';
import { getDocuments } from '../lib/apiClient';

export default function Ask() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(searchParams.get('doc') || '');

  useEffect(() => {
    getDocuments().then(({ data }) => {
      setDocuments(data.documents || []);
      if (!selectedDoc && data.documents?.length) setSelectedDoc(data.documents[0].id);
    }).catch(() => {});
  }, []);

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '780px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: '0.4rem' }}
        >
          Ask AI
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Ask any question from your uploaded documents.
        </p>
      </div>

      {/* Document selector */}
      <div
        style={{
          padding: '1.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
        }}
      >
        <label
          htmlFor="doc-select"
          style={{
            display: 'block',
            fontWeight: 500,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
          }}
        >
          Document
        </label>
        <select
          id="doc-select"
          className="input"
          value={selectedDoc}
          onChange={(e) => setSelectedDoc(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Choose a document —</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>{d.filename}</option>
          ))}
        </select>
        {documents.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '0.5rem' }}>
            No documents found.{' '}
            <a href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Upload one first.
            </a>
          </p>
        )}
      </div>

      <QuestionBox documentId={selectedDoc} />
    </div>
  );
}
