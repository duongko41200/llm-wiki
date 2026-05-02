import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Database from '@tauri-apps/plugin-sql';
import { Globe, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface ProgressEvent {
  status: string;
  percent: number;
}

export const UrlInput: React.FC = () => {
  const { documents, setDocuments } = useAppStore();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const isValidUrl = (str: string) => {
    try { new URL(str); return true; } catch { return false; }
  };

  const handleIngest = async () => {
    if (!isValidUrl(url)) {
      setMessage('URL không hợp lệ. Vui lòng nhập URL bắt đầu bằng https://');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('Đang khởi tạo...');
    setProgress(0);

    // Listen to progress events
    const unlisten = await listen<ProgressEvent>('ingest_progress', (e) => {
      setMessage(e.payload.status);
      setProgress(e.payload.percent);
    });

    try {
      const documentId = `url_${Date.now()}`;
      const domain = new URL(url).hostname;
      const title = `Web: ${domain}`;

      // Save to DB first
      const db = await Database.load('sqlite:knowledge_forge.db');
      await db.execute(
        `INSERT INTO documents (id, title, original_filename, raw_path, file_type, status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [documentId, title, domain, url, 'url', 'pending']
      );

      // Ingest
      await invoke('ingest_url', { url, documentId });

      // Update status to ready
      await db.execute(
        `UPDATE documents SET status = 'ready' WHERE id = $1`,
        [documentId]
      );

      setStatus('done');
      setMessage(`Đã tải thành công nội dung từ ${domain}!`);
      setUrl('');
      setProgress(100);

      // Refresh document list
      const docs = await db.select('SELECT * FROM documents ORDER BY created_at DESC');
      setDocuments(docs as any);

    } catch (err: any) {
      setStatus('error');
      setMessage(`Lỗi: ${err}`);

      // Update db status to error
      try {
        const db = await Database.load('sqlite:knowledge_forge.db');
        await db.execute(
          `UPDATE documents SET status = 'error', error_message = $1 WHERE raw_path = $2`,
          [String(err), url]
        );
      } catch {}
    } finally {
      unlisten();
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '1.25rem',
      backgroundColor: 'var(--bg-card)',
    }}>
      <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
        <Globe size={18} color="#60a5fa" />
        Nhập URL Website
      </h4>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (status !== 'idle') setStatus('idle'); }}
          placeholder="https://example.com/article"
          disabled={status === 'loading'}
          style={{
            flex: 1,
            padding: '0.6rem 0.8rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleIngest(); }}
        />
        <button
          onClick={handleIngest}
          disabled={status === 'loading' || !url.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1rem',
            backgroundColor: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '8px',
            cursor: status === 'loading' || !url.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '0.85rem',
            opacity: status === 'loading' || !url.trim() ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {status === 'loading' ? 'Đang tải...' : '📥 Tải nội dung'}
        </button>
      </div>

      {status === 'loading' && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{message}</div>
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#3b82f6',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {(status === 'done' || status === 'error') && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.6rem 0.8rem',
          borderRadius: '8px',
          backgroundColor: status === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${status === 'done' ? '#22c55e' : '#ef4444'}`,
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem',
        }}>
          {status === 'done' ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
          {message}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
