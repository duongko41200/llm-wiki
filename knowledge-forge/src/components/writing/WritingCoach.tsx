import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { WritingResult } from './WritingResult';
import { Send, Loader2 } from 'lucide-react';

export const WritingCoach: React.FC = () => {
  const { llmConfig, writingLoading, setWritingLoading, setWritingResult } = useAppStore();
  
  const [topic, setTopic] = useState('Write an email to a friend about your recent holiday (approx 50 words).');
  const [text, setText] = useState('');

  const handleGrade = async () => {
    if (!text.trim()) return;
    
    setWritingLoading(true);
    setWritingResult(null); // Clear previous result
    
    try {
      const result: any = await invoke('grade_writing', {
        userText: text,
        promptTopic: topic,
        llmConfig,
      });
      
      setWritingResult(result);
      
      // Also reload error notes because new ones might have been created
      const notes: any = await invoke('get_error_notes');
      useAppStore.getState().setErrorNotes(notes);
      
    } catch (err) {
      console.error("Failed to grade writing:", err);
      alert("Đã xảy ra lỗi khi chấm bài: " + String(err));
    } finally {
      setWritingLoading(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'stretch' }}>
      
      {/* Left Column: Editor */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        minWidth: '400px'
      }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Đề bài (Topic)
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Nhập đề bài ở đây..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Bài làm của bạn
            </label>
            <span style={{ fontSize: '0.8rem', color: wordCount < 30 ? '#f59e0b' : 'var(--text-muted)' }}>
              {wordCount} words
            </span>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Viết bài làm của bạn vào đây..."
            style={{
              flex: 1,
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6
            }}
          />
        </div>

        <button
          onClick={handleGrade}
          disabled={writingLoading || text.trim().length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: writingLoading || text.trim().length === 0 ? 'var(--border-color)' : '#3b82f6',
            color: writingLoading || text.trim().length === 0 ? 'var(--text-muted)' : 'white',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: writingLoading || text.trim().length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {writingLoading ? (
            <><Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Đang chấm bài (AI)...</>
          ) : (
            <><Send size={18} /> Gửi AI chấm điểm</>
          )}
        </button>

      </div>

      {/* Right Column: Result */}
      <div style={{ 
        flex: 1, 
        minWidth: '400px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: '12px',
      }}>
        {useAppStore.getState().writingResult ? (
          <WritingResult />
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px dashed var(--border-color)',
            borderRadius: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>✍️</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Chưa có kết quả</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.5 }}>
              Hãy nhập đề bài và bài viết của bạn ở cột bên trái, sau đó bấm <strong>Gửi AI chấm điểm</strong>.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
