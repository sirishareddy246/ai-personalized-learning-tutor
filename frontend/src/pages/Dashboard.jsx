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
    setSuccess(`"${data.document.filename}" uploaded — ${data.chunksCreated} chunks indexed.`);
    fetchDocs();
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '820px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '2.25rem' }}>
        <h1
          className="font-display"
          style={{
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
            marginBottom: '0.4rem',
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Upload your study materials and manage your documents.
        </p>
      </div>

      {/* Upload zone */}
      <FileUpload onUploadSuccess={onUploadSuccess} />

      {/* Success toast */}
      {success && (
        <div
          className="toast"
          style={{
            marginTop: '1rem',
            padding: '0.85rem 1.25rem',
            background: 'var(--success-subtle)',
            border: '1px solid rgba(106,138,95,0.35)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span> {success}
        </div>
      )}

      {/* Documents section */}
      <div style={{ marginTop: '2.75rem' }}>
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            letterSpacing: '0.01em',
          }}
        >
          Your Documents
        </h2>

        {loading ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <div className="thinking-dots"><span /><span /><span /></div>
            <span style={{ fontSize: 'var(--text-sm)' }}>Loading documents…</span>
          </div>
        ) : documents.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No documents yet. Upload one above to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {documents.map((doc, i) => (
              <div
                key={doc.id}
                className="glass"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                  {/* Document icon */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--bg-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '1rem',
                    }}
                  >
                    📄
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 500,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.filename}
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                      {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 'var(--text-xs)', padding: '0.4rem 0.85rem' }}
                    onClick={() => navigate(`/ask?doc=${doc.id}`)}
                  >
                    Ask
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 'var(--text-xs)', padding: '0.4rem 0.85rem' }}
                    onClick={() => navigate(`/quiz?doc=${doc.id}`)}
                  >
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
