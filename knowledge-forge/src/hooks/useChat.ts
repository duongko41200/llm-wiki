import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export type ChatMode = 'general' | 'compare' | 'quiz';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  createdAt: number;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('general');
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);

  // We use a ref to keep track of the current streaming message content
  // to avoid constant re-renders from state updates overriding each other if not careful
  const streamingContentRef = useRef('');

  useEffect(() => {
    // Listen for streaming chunks
    const unlistenChunk = listen<string>('chat_chunk', (event) => {
      streamingContentRef.current += event.payload;
      
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'streaming') {
          // Update the streaming message
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            content: streamingContentRef.current
          };
          return newMessages;
        } else {
          // Add a new streaming message
          return [...prev, {
            id: 'streaming',
            role: 'assistant',
            content: streamingContentRef.current,
            mode: currentMode,
            createdAt: Date.now()
          }];
        }
      });
    });

    const unlistenDone = listen('chat_done', () => {
      setIsLoading(false);
      
      // Finalize the streaming message
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.id === 'streaming') {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            id: Date.now().toString() // give it a real ID
          };
          
          // TODO: Here we could save the finalized message to SQLite
          return newMessages;
        }
        return prev;
      });
    });

    return () => {
      unlistenChunk.then(f => f());
      unlistenDone.then(f => f());
    };
  }, [currentMode]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (currentMode === 'compare' && selectedContextIds.length < 2) {
      alert("Vui lòng chọn ít nhất 2 tài liệu để so sánh.");
      return;
    }

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      mode: currentMode,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    streamingContentRef.current = '';

    try {
      // Save user message to DB (todo)
      
      // Call backend which will stream responses via Tauri events
      await invoke('send_chat_message', {
        message: content,
        mode: currentMode,
        contextIds: selectedContextIds
      });
    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Lỗi:** ${error}`,
        mode: currentMode,
        createdAt: Date.now()
      }]);
    }
  };

  const generateQuiz = async (documentId: string) => {
    setIsLoading(true);
    try {
      const resultStr = await invoke<string>('generate_quiz', { documentId });
      // The result is a JSON string of QuizResponse
      // For now, we just add it as an assistant message. 
      // In a real app, we'd parse it and render a Quiz component.
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `\`\`\`json\n${resultStr}\n\`\`\``,
        mode: 'quiz',
        createdAt: Date.now()
      }]);
    } catch (error) {
      console.error("Quiz error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    currentMode,
    setCurrentMode,
    selectedContextIds,
    setSelectedContextIds,
    sendMessage,
    generateQuiz
  };
}
