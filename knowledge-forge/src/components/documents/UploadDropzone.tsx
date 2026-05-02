import React, { useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import Database from '@tauri-apps/plugin-sql';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore, DocumentRecord } from '../../stores/appStore';
import { useIngest } from '../../hooks/useIngest';
import { UrlInput } from './UrlInput';

export const UploadDropzone: React.FC = () => {
  const {
    uploadedFileName, parsedPath, fileType,
    setUploadedFile, setParseResult, setDocuments, documentsLoading, setDocumentsLoading
  } = useAppStore();

  const { startIngest, ingestStatus, ingestError, ingestResult, ingestProgress } = useIngest();

  const fetchDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      const db = await Database.load('sqlite:knowledge_forge.db');
      const docs: DocumentRecord[] = await db.select(
        'SELECT * FROM documents ORDER BY created_at DESC'
      );
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocumentsLoading(false);
    }
  }, [setDocuments, setDocumentsLoading]);

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Documents',
          extensions: ['pdf', 'docx', 'txt', 'md']
        }]
      });

      if (!selected) return;

      const absolutePath = typeof selected === 'string' ? selected : selected.path;
      if (!absolutePath) return;

      const fileName = absolutePath.split(/[\\/]/).pop() || 'Unknown file';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      const db = await Database.load('sqlite:knowledge_forge.db');
      const docId = crypto.randomUUID();

      await db.execute(
        `INSERT INTO documents (id, title, original_filename, raw_path, file_type, status, file_size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [docId, fileName.replace(/\.[^/.]+$/, ""), fileName, absolutePath, ext, 'uploading', null]
      );

      setUploadedFile(fileName, absolutePath, ext);
      setParseResult('File ready for processing.');

      // Refresh list
      fetchDocuments();

      // Automatically start ingestion
      await startIngest(docId, absolutePath);
      
      // Refresh list after ingestion
      fetchDocuments();

    } catch (err) {
      console.error('Upload flow error:', err);
      alert('Lỗi chọn file: ' + String(err));
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div 
        onClick={ingestStatus === 'ingesting' ? undefined : handleSelectFile}
        style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: ingestStatus === 'ingesting' ? 'not-allowed' : 'pointer',
          backgroundColor: ingestStatus === 'ingesting' ? 'rgba(0,0,0,0.05)' : 'var(--bg-card)',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <Upload size={48} color={ingestStatus === 'ingesting' ? '#9ca3af' : '#60a5fa'} />
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
            Tải tài liệu lên (PDF, DOCX, TXT)
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Click để mở hộp thoại chọn file
          </p>
        </div>
      </div>

      {uploadedFileName && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
            <FileText size={18} color="#60a5fa" />
            {uploadedFileName}
          </div>

          {ingestStatus === 'ingesting' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', marginTop: '0.5rem' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang xử lý tài liệu (trích xuất & tạo vector nhúng)...</span>
              {ingestProgress && (
                <span style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                  {ingestProgress.status || `${ingestProgress.current}%`}
                </span>
              )}
            </div>
          )}

          {ingestStatus === 'done' && ingestResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', marginTop: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>Xử lý hoàn tất! Đã tạo <strong>{ingestResult.chunks_count}</strong> đoạn dữ liệu.</span>
            </div>
          )}

          {ingestStatus === 'error' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#ef4444', marginTop: '0.5rem' }}>
              <XCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>Lỗi xử lý</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{ingestError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>hoặc</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>
        <UrlInput />
      </div>
    </div>
  );
};
