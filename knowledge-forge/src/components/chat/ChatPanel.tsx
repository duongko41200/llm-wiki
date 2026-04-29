import React, { useState } from 'react';
import { Send, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { useChat, ChatMessage } from '../../hooks/useChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const [input, setInput] = useState('');
  
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* Header - Mode Selector */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
        <button 
          onClick={() => setCurrentMode('general')}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentMode === 'general' ? '#3b82f6' : 'transparent', color: 'white', border: '1px solid #3b82f6', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <BookOpen size={16} /> General Q&A
        </button>
        <button 
          onClick={() => setCurrentMode('compare')}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentMode === 'compare' ? '#3b82f6' : 'transparent', color: 'white', border: '1px solid #3b82f6', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Layers size={16} /> Compare
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
            <h2>Ask KnowledgeForge</h2>
            <p>Select a mode above and start chatting based on your ingested Wiki.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
            KnowledgeForge is thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', gap: '0.5rem' }}>
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentMode === 'quiz' ? 'Type a document name to generate quiz...' : 'Ask a question...'}
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
          onClick={currentMode === 'quiz' ? () => { generateQuiz(input); setInput(''); } : handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0 1.5rem',
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
