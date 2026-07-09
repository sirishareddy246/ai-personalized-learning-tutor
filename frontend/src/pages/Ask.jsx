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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ask AI 🤖</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Ask any question from your uploaded documents.</p>

      {/* Document selector */}
      <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Document</label>
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
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
            No documents found. <a href="/dashboard" style={{ color: 'var(--primary)' }}>Upload one first.</a>
          </p>
        )}
      </div>

      <QuestionBox documentId={selectedDoc} />
    </div>
  );
}
