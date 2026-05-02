import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { FileText, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import { useAppStore, DocumentRecord, ChunkRecord } from '../../stores/appStore';

export const DocumentsPanel: React.FC = () => {
  const { documents, documentsLoading, setDocuments, setDocumentsLoading, setSelectedContextIds } = useAppStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkRecord[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  const fetchDocuments = async () => {
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
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchChunks = async () => {
      if (!selectedDocId) {
        setChunks([]);
        return;
      }
      try {
        setChunksLoading(true);
        const res = await invoke<ChunkRecord[]>('get_document_chunks', { documentId: selectedDocId });
        setChunks(res);
      } catch (err) {
        console.error('Failed to fetch chunks:', err);
      } finally {
        setChunksLoading(false);
      }
    };
    fetchChunks();
  }, [selectedDocId]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này và toàn bộ dữ liệu vector của nó?')) {
      return;
    }
    try {
      await invoke('delete_document', { documentId: docId });
      if (selectedDocId === docId) setSelectedDocId(null);
      fetchDocuments();
    } catch (err) {
      alert('Lỗi khi xóa tài liệu: ' + err);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
      {/* Left panel: List of documents */}
      <div style={{
        flex: '0 0 300px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        paddingRight: '1rem',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Tài liệu đã tải lên</h3>
        
        {documentsLoading && <p>Đang tải danh sách...</p>}
        {!documentsLoading && documents.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có tài liệu nào.</p>
        )}
        
        {documents.map(doc => (
          <div
            key={doc.id}
            onClick={() => setSelectedDocId(doc.id)}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: selectedDocId === doc.id ? 'var(--bg-card)' : 'transparent',
              border: `1px solid ${selectedDocId === doc.id ? '#60a5fa' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', overflow: 'hidden' }}>
                <FileText size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {doc.title || doc.original_filename}
                </span>
              </div>
              <button 
                onClick={(e) => handleDelete(e, doc.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Xóa tài liệu"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
              <span style={{
                color: doc.status === 'ready' ? '#22c55e' : (doc.status === 'error' ? '#ef4444' : '#eab308')
              }}>
                {doc.status === 'ready' ? 'Đã xử lý' : doc.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right panel: Document details & chunks */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        {selectedDoc ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedDoc.title}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                  <span>File: {selectedDoc.original_filename}</span>
                  <span>Size: {selectedDoc.file_size_bytes ? Math.round(selectedDoc.file_size_bytes / 1024) + ' KB' : 'Unknown'}</span>
                </div>
              </div>
            </div>

            {selectedDoc.status === 'ready' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => {
                    setSelectedContextIds([selectedDoc.id]);
                    alert('Chuyển sang tab Chat để hỏi đáp về tài liệu này.');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6', color: '#fff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  <MessageSquare size={16} /> Hỏi đáp tài liệu này
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Chuyển sang tab Chat để bắt đầu tạo Quiz từ tài liệu này?')) return;
                    setSelectedContextIds([selectedDoc.id]);
                    useAppStore.getState().setChatMode('quiz');
                    // Gửi lệnh tạo quiz vào chat (fake tin nhắn để UI hiển thị)
                    const quizMsg = "Hãy tạo bài quiz từ tài liệu này.";
                    useAppStore.getState().addChatMessage({
                      id: Date.now().toString(),
                      role: 'user',
                      content: quizMsg,
                      mode: 'quiz',
                      createdAt: Date.now()
                    });
                    useAppStore.getState().setChatLoading(true);
                    try {
                      const res = await invoke<string>('generate_quiz', { documentId: selectedDoc.id });
                      useAppStore.getState().addChatMessage({
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: res,
                        mode: 'quiz',
                        createdAt: Date.now()
                      });
                    } catch (e) {
                      useAppStore.getState().addChatMessage({
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: 'Lỗi tạo quiz: ' + e,
                        mode: 'quiz',
                        createdAt: Date.now()
                      });
                    } finally {
                      useAppStore.getState().setChatLoading(false);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8b5cf6', color: '#fff',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  <HelpCircle size={16} /> Tạo bài trắc nghiệm
                </button>
              </div>
            )}

            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Nội dung đã phân rã ({chunks.length} chunks)
              </h4>
              
              {chunksLoading ? (
                <p>Đang tải nội dung...</p>
              ) : chunks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chunks.map(chunk => (
                    <div key={chunk.id} style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Chunk #{chunk.chunk_index} ({chunk.word_count} từ)
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Không có nội dung cho tài liệu này.</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Chọn một tài liệu để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
};
