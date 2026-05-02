import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAppStore, ChatMode, ChatMessage } from '../stores/appStore';

export type { ChatMode, ChatMessage };

export function useChat() {
  const {
    chatMessages, chatIsLoading, chatMode, selectedContextIds,
    llmConfig, useRag,
    addChatMessage, appendStreamChunk, finalizeStream, setChatMode, setChatLoading,
    clearChat,
  } = useAppStore();

  const currentModeRef = useRef(chatMode);
  currentModeRef.current = chatMode;
  const currentContextRef = useRef(selectedContextIds);
  currentContextRef.current = selectedContextIds;
  const llmConfigRef = useRef(llmConfig);
  llmConfigRef.current = llmConfig;
  const useRagRef = useRef(useRag);
  useRagRef.current = useRag;
  const messagesRef = useRef(chatMessages);
  messagesRef.current = chatMessages;

  useEffect(() => {
    const unlistenChunk = listen<string>('chat_chunk', (event) => {
      appendStreamChunk(event.payload);
    });
    const unlistenDone = listen('chat_done', () => {
      finalizeStream();
    });
    return () => {
      unlistenChunk.then(f => f());
      unlistenDone.then(f => f());
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || chatIsLoading) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      mode: currentModeRef.current,
      createdAt: Date.now(),
    };

    addChatMessage(newMsg);
    setChatLoading(true);

    // Build history: exclude current user message + streaming placeholder
    // Keep last 6 messages only (3 back-and-forth) to reduce token count
    const history = messagesRef.current
      .filter(m => m.id !== 'streaming' && m.id !== newMsg.id)
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      await invoke('send_chat_message', {
        message: content,
        mode: currentModeRef.current,
        contextIds: currentContextRef.current,
        history,
        useRag: useRagRef.current,
        llmConfig: llmConfigRef.current,
      });
    } catch (error) {
      finalizeStream();
      addChatMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Lỗi:** ${error}`,
        mode: currentModeRef.current,
        createdAt: Date.now(),
      });
    }
  };

  const generateQuiz = async (documentId: string) => {
    if (!documentId) return;
    setChatLoading(true);
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: '🎯 Hãy tạo bài quiz từ tài liệu này.',
      mode: 'quiz',
      createdAt: Date.now(),
    });

    try {
      const resultStr = await invoke<string>('generate_quiz', {
        documentId,
        llmConfig: llmConfigRef.current,
      });
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `\`\`\`json\n${resultStr}\n\`\`\``,
        mode: 'quiz',
        createdAt: Date.now(),
      });
    } catch (error) {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Lỗi tạo quiz:** ${error}`,
        mode: 'quiz',
        createdAt: Date.now(),
      });
    } finally {
      setChatLoading(false);
    }
  };

  return {
    messages: chatMessages,
    isLoading: chatIsLoading,
    currentMode: chatMode,
    setCurrentMode: setChatMode,
    sendMessage,
    generateQuiz,
    clearChat,
  };
}
