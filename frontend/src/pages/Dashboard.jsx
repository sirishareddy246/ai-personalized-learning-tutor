import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { getDocuments } from '../lib/apiClient';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      const { data } = await getDocuments();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const onUploadSuccess = (data) => {
    setSuccess(`✅ "${data.document.filename}" uploaded — ${data.chunksCreated} chunks indexed.`);
    fetchDocs();
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Upload study materials and manage your documents.</p>

      <FileUpload onUploadSuccess={onUploadSuccess} />

      {success && (
        <div className="fade-in" style={{ marginTop: '1rem', padding: '0.85rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', color: '#10b981', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '2.5rem', marginBottom: '1rem' }}>Your Documents</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}><span className="spinner" /></div>
      ) : documents.length === 0 ? (
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
          No documents yet. Upload one above to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {documents.map((doc) => (
            <div key={doc.id} className="glass" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📄</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>{new Date(doc.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }} onClick={() => navigate(`/ask?doc=${doc.id}`)}>Ask</button>
                <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }} onClick={() => navigate(`/quiz?doc=${doc.id}`)}>Quiz</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
