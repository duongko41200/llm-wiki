import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, Layers, CheckSquare, FileText, Check } from 'lucide-react';
import { useChat, ChatMessage } from '../../hooks/useChat';
import { useAppStore } from '../../stores/appStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Database from '@tauri-apps/plugin-sql';

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem'
    }}>
      <div style={{
        maxWidth: '80%',
        width: 'fit-content',
        padding: '1rem',
        borderRadius: '8px',
        backgroundColor: isUser ? '#2563eb' : '#1e293b',
        color: isUser ? 'white' : '#e2e8f0',
        borderBottomRightRadius: isUser ? '0' : '8px',
        borderBottomLeftRadius: !isUser ? '0' : '8px',
      }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>
          {isUser ? 'You' : 'KnowledgeForge'} • {msg.mode}
        </div>
        <div className="markdown-body" style={{ color: 'inherit', backgroundColor: 'transparent' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export const ChatPanel = () => {
  const { 
    messages, 
    isLoading, 
    currentMode, 
    setCurrentMode, 
    sendMessage,
    generateQuiz
  } = useChat();

  const { chatMessages, selectedContextIds, setSelectedContextIds, documents, setDocuments } = useAppStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);
  
  // Fetch docs if empty
  useEffect(() => {
    if (documents.length === 0) {
      Database.load('sqlite:knowledge_forge.db').then(db => {
        db.select('SELECT * FROM documents WHERE status = "ready" ORDER BY created_at DESC').then((docs: any) => {
          setDocuments(docs);
        });
      });
    }
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleContext = (id: string) => {
    if (selectedContextIds.includes(id)) {
      setSelectedContextIds(selectedContextIds.filter(x => x !== id));
    } else {
      setSelectedContextIds([...selectedContextIds, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', gap: '1rem' }}>
      
      {/* Context Selector Sidebar */}
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Tài liệu tham chiếu</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Chọn tài liệu để chatbot tìm kiếm nội dung (RAG). Bỏ chọn để tìm trên tất cả.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {documents.filter(d => d.status === 'ready').map(doc => {
            const isSelected = selectedContextIds.includes(doc.id);
            return (
              <div 
                key={doc.id}
                onClick={() => toggleContext(doc.id)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ 
                  width: '16px', height: '16px', 
                  borderRadius: '3px', 
                  border: `1px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? '#3b82f6' : 'transparent'
                }}>
                  {isSelected && <Check size={12} color="white" />}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.title || doc.original_filename}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Header - Mode Selector */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
          <button 
            onClick={() => setCurrentMode('general')}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentMode === 'general' ? '#3b82f6' : 'transparent', color: 'white', border: '1px solid #3b82f6', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <BookOpen size={16} /> Hỏi đáp (RAG)
          </button>
          <button 
            onClick={() => setCurrentMode('compare')}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentMode === 'compare' ? '#3b82f6' : 'transparent', color: 'white', border: '1px solid #3b82f6', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Layers size={16} /> So sánh
          </button>
          <button 
            onClick={() => setCurrentMode('quiz')}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentMode === 'quiz' ? '#3b82f6' : 'transparent', color: 'white', border: '1px solid #3b82f6', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CheckSquare size={16} /> Generate Quiz
          </button>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: 'var(--bg-main)' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <h2>KnowledgeForge Assistant</h2>
              <p>Chọn mode ở trên và bắt đầu hỏi đáp. Hệ thống sẽ tự động trích xuất nội dung liên quan nhất (RAG).</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
              Đang tìm kiếm tài liệu và suy nghĩ...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', gap: '0.5rem' }}>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentMode === 'quiz' ? 'Hệ thống sẽ tạo quiz dựa trên tài liệu đang chọn...' : 
              currentMode === 'compare' ? 'Bạn muốn so sánh điều gì giữa các tài liệu đã chọn?' : 
              'Hỏi đáp nội dung tài liệu...'
            }
            disabled={currentMode === 'quiz' && selectedContextIds.length !== 1}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'white',
              resize: 'none',
              fontFamily: 'inherit',
              height: '50px'
            }}
          />
          <button 
            onClick={currentMode === 'quiz' ? () => generateQuiz(selectedContextIds[0] || '') : handleSend}
            disabled={isLoading || (currentMode !== 'quiz' && !input.trim()) || (currentMode === 'quiz' && selectedContextIds.length !== 1)}
            style={{
              padding: '0 1.5rem',
              borderRadius: '4px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: (isLoading || (currentMode !== 'quiz' && !input.trim()) || (currentMode === 'quiz' && selectedContextIds.length !== 1)) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || (currentMode !== 'quiz' && !input.trim()) || (currentMode === 'quiz' && selectedContextIds.length !== 1)) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
