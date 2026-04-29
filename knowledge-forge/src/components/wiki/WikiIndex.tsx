import React, { useEffect } from 'react';
import { useWiki } from '../../hooks/useWiki';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const WikiIndex: React.FC = () => {
  const { indexContent, isLoading, error, loadWikiIndex } = useWiki();

  useEffect(() => {
    loadWikiIndex();
  }, [loadWikiIndex]);

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      padding: '2rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      minHeight: '60vh'
    }}>
      <h2>Wiki Index</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={loadWikiIndex}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Refresh Index
        </button>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export as PDF
        </button>
      </div>

      {isLoading && <p>Loading wiki index...</p>}
      {error && <p style={{ color: 'coral' }}>Error: {error}</p>}
      
      {!isLoading && !error && (
        <div className="markdown-body" style={{ color: 'var(--text-color)' }}>
          {indexContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {indexContent}
            </ReactMarkdown>
          ) : (
            <p>No wiki index found. Ingest some documents first.</p>
          )}
        </div>
      )}
    </div>
  );
};
