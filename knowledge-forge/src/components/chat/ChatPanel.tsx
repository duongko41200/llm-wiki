import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, Layers, CheckSquare, Check, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
      marginBottom: '1rem',
      alignItems: 'flex-end',
      gap: '0.5rem',
    }}>
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: '#3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
        }}>KF</div>
      )}
      <div style={{
        maxWidth: '75%',
        width: 'fit-content',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        backgroundColor: isUser ? '#2563eb' : 'var(--bg-card)',
        color: isUser ? 'white' : 'var(--text-main)',
        border: isUser ? 'none' : '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}>
        <div className="markdown-body" style={{ color: 'inherit', backgroundColor: 'transparent', fontSize: '0.92rem', lineHeight: 1.6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.3rem', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
    generateQuiz,
    clearChat,
  } = useChat();

  const {
    chatMessages, selectedContextIds, setSelectedContextIds,
    documents, setDocuments, useRag, setUseRag, llmConfig,
  } = useAppStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

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

  const modeButtons = [
    { mode: 'general' as const, icon: <BookOpen size={15} />, label: 'Hỏi đáp' },
    { mode: 'compare' as const, icon: <Layers size={15} />, label: 'So sánh' },
    { mode: 'quiz' as const, icon: <CheckSquare size={15} />, label: 'Quiz' },
  ];

  const providerBadge = llmConfig.provider === 'ollama'
    ? { emoji: '🖥️', label: `Ollama · ${llmConfig.model}`, color: '#22c55e' }
    : { emoji: '✨', label: `Gemini · ${llmConfig.model}`, color: '#a78bfa' };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', gap: '1rem' }}>

      {/* Context Selector Sidebar */}
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* RAG Toggle */}
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}>
          <div
            onClick={() => setUseRag(!useRag)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              color: useRag ? '#3b82f6' : 'var(--text-muted)',
            }}
          >
            {useRag ? <ToggleRight size={20} color="#3b82f6" /> : <ToggleLeft size={20} />}
            {useRag ? 'RAG: BẬT' : 'RAG: TẮT'}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>
            {useRag ? 'Bot tìm trong tài liệu' : 'Chat thuần, không tìm tài liệu'}
          </p>
        </div>

        {/* Document list */}
        <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          📚 Tài liệu tham chiếu
        </h4>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
          {documents.filter(d => d.status === 'ready').length === 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Chưa có tài liệu nào. Hãy upload ở tab đầu tiên.</p>
          )}
          {documents.filter(d => d.status === 'ready').map(doc => {
            const isSelected = selectedContextIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => toggleContext(doc.id)}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  transition: 'all 0.1s ease',
                }}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                  border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                }}>
                  {isSelected && <Check size={10} color="white" />}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.title || doc.original_filename}
                </span>
              </div>
            );
          })}
        </div>

        {/* Provider badge */}
        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--bg-card)',
          border: `1px solid var(--border-color)`,
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: providerBadge.color,
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          fontWeight: 600,
        }}>
          <span>{providerBadge.emoji}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {providerBadge.label}
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-sidebar)',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {modeButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setCurrentMode(mode)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  backgroundColor: currentMode === mode ? '#3b82f6' : 'transparent',
                  color: currentMode === mode ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${currentMode === mode ? '#3b82f6' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  display: 'flex', gap: '0.3rem', alignItems: 'center',
                  fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <button
            onClick={clearChat}
            title="Xóa toàn bộ lịch sử chat"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.7rem',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.78rem',
            }}
          >
            <Trash2 size={13} /> Xóa chat
          </button>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', backgroundColor: 'var(--bg-main)' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>KnowledgeForge Assistant</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                {useRag
                  ? 'Chọn tài liệu ở sidebar và bắt đầu hỏi đáp. Bot sẽ tìm nội dung liên quan nhất để trả lời.'
                  : 'Chế độ Pure Chat — Bot trả lời bằng kiến thức chung, không tìm trong tài liệu.'
                }
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '0.5rem 0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    animation: `bounce 1s ease ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
              {useRag ? 'Đang tìm kiếm tài liệu và tổng hợp câu trả lời...' : 'Đang suy nghĩ...'}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentMode === 'quiz' ? 'Chọn 1 tài liệu rồi click Generate Quiz →' :
              currentMode === 'compare' ? 'Bạn muốn so sánh điều gì giữa các tài liệu đã chọn?' :
              useRag ? 'Hỏi về nội dung tài liệu... (Enter để gửi)' : 'Chat tự do với AI... (Enter để gửi)'
            }
            disabled={currentMode === 'quiz'}
            style={{
              flex: 1, padding: '0.65rem 0.85rem', borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)', color: 'var(--text-main)',
              resize: 'none', fontFamily: 'inherit', height: '48px',
              fontSize: '0.9rem',
            }}
          />
          <button
            onClick={
              currentMode === 'quiz'
                ? () => generateQuiz(selectedContextIds[0] || '')
                : handleSend
            }
            disabled={
              isLoading ||
              (currentMode !== 'quiz' && !input.trim()) ||
              (currentMode === 'quiz' && selectedContextIds.length !== 1)
            }
            style={{
              padding: '0 1.2rem',
              borderRadius: '8px',
              backgroundColor: '#3b82f6', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isLoading || (currentMode !== 'quiz' && !input.trim()) ? 0.5 : 1,
              transition: 'opacity 0.15s ease',
              minWidth: '48px',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
