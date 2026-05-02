import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngestResult {
  document_id: string;
  status: string;
  chunks_count: number;
  error_message: string | null;
}

export interface DocumentRecord {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  status: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface ChunkRecord {
  id: number;
  document_id: string;
  chunk_index: number;
  content: string;
  word_count: number;
}

export type ChatMode = 'general' | 'compare' | 'quiz';
export type LlmProviderType = 'ollama' | 'gemini';

export interface LlmConfig {
  provider: LlmProviderType;
  model: string;
  api_key?: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  createdAt: number;
}

// ─── Provider presets ─────────────────────────────────────────────────────────

export const OLLAMA_MODELS = [
  'qwen2.5:3b',
  'qwen2.5:7b',
  'llama3.2:3b',
  'llama3.1:8b',
  'mistral:7b',
  'phi3:3.8b',
];

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
];

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Documents / Upload ──────────────────────────────────────────────────
  uploadedFileName: string | null;
  parsedPath: string | null;
  parseResult: string | null;
  fileType: string | null;
  ingestStatus: 'idle' | 'ingesting' | 'done' | 'error';
  ingestError: string | null;
  ingestResult: IngestResult | null;
  ingestProgress: { current: number; total: number; status?: string } | null;
  documents: DocumentRecord[];
  documentsLoading: boolean;

  // ── Chat ─────────────────────────────────────────────────────────────────
  chatMessages: ChatMessage[];
  chatMode: ChatMode;
  chatIsLoading: boolean;
  streamingContent: string;
  selectedContextIds: string[];
  useRag: boolean;

  // ── LLM Provider (persisted) ──────────────────────────────────────────────
  llmConfig: LlmConfig;

  // ── Actions: Upload ───────────────────────────────────────────────────────
  setUploadedFile: (fileName: string, parsedPath: string, fileType: string) => void;
  setParseResult: (result: string) => void;
  setIngestStatus: (s: 'idle' | 'ingesting' | 'done' | 'error') => void;
  setIngestError: (e: string | null) => void;
  setIngestResult: (r: IngestResult | null) => void;
  setIngestProgress: (p: { current: number; total: number; status?: string } | null) => void;
  setDocuments: (docs: DocumentRecord[]) => void;
  setDocumentsLoading: (v: boolean) => void;
  resetUpload: () => void;

  // ── Actions: Chat ─────────────────────────────────────────────────────────
  addChatMessage: (msg: ChatMessage) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
  setChatMode: (mode: ChatMode) => void;
  setChatLoading: (v: boolean) => void;
  setSelectedContextIds: (ids: string[]) => void;
  setUseRag: (v: boolean) => void;
  clearChat: () => void;

  // ── Actions: LLM Config ────────────────────────────────────────────────────
  setLlmConfig: (config: Partial<LlmConfig>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Upload defaults
      uploadedFileName: null,
      parsedPath: null,
      parseResult: null,
      fileType: null,
      ingestStatus: 'idle',
      ingestError: null,
      ingestResult: null,
      ingestProgress: null,
      documents: [],
      documentsLoading: false,

      // Chat defaults
      chatMessages: [],
      chatMode: 'general',
      chatIsLoading: false,
      streamingContent: '',
      selectedContextIds: [],
      useRag: true,

      // LLM Provider defaults
      llmConfig: {
        provider: 'ollama',
        model: 'qwen2.5:3b',
        api_key: undefined,
      },

      // ── Upload actions ───────────────────────────────────────────────────
      setUploadedFile: (fileName, parsedPath, fileType) => set({
        uploadedFileName: fileName, parsedPath, fileType,
        parseResult: null,
        ingestStatus: 'idle', ingestError: null, ingestResult: null, ingestProgress: null,
      }),
      setParseResult: (result) => set({ parseResult: result }),
      setIngestStatus: (s) => set({ ingestStatus: s }),
      setIngestError: (e) => set({ ingestError: e }),
      setIngestResult: (r) => set({ ingestResult: r }),
      setIngestProgress: (p) => set({ ingestProgress: p }),
      setDocuments: (docs) => set({ documents: docs }),
      setDocumentsLoading: (v) => set({ documentsLoading: v }),
      resetUpload: () => set({
        uploadedFileName: null, parsedPath: null, fileType: null,
        parseResult: null,
        ingestStatus: 'idle', ingestError: null, ingestResult: null, ingestProgress: null,
      }),

      // ── Chat actions ──────────────────────────────────────────────────────
      addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
      appendStreamChunk: (chunk) => {
        const content = get().streamingContent + chunk;
        set((s) => {
          const msgs = [...s.chatMessages];
          const last = msgs[msgs.length - 1];
          if (last && last.id === 'streaming') {
            msgs[msgs.length - 1] = { ...last, content };
          } else {
            msgs.push({ id: 'streaming', role: 'assistant', content, mode: s.chatMode, createdAt: Date.now() });
          }
          return { chatMessages: msgs, streamingContent: content };
        });
      },
      finalizeStream: () => set((s) => {
        const msgs = [...s.chatMessages];
        const last = msgs[msgs.length - 1];
        if (last && last.id === 'streaming') {
          msgs[msgs.length - 1] = { ...last, id: Date.now().toString() };
        }
        return { chatMessages: msgs, chatIsLoading: false, streamingContent: '' };
      }),
      setChatMode: (mode) => set({ chatMode: mode }),
      setChatLoading: (v) => set({ chatIsLoading: v }),
      setSelectedContextIds: (ids) => set({ selectedContextIds: ids }),
      setUseRag: (v) => set({ useRag: v }),
      clearChat: () => set({ chatMessages: [], streamingContent: '', chatIsLoading: false }),

      // ── LLM config actions ────────────────────────────────────────────────
      setLlmConfig: (config) => set((s) => ({
        llmConfig: { ...s.llmConfig, ...config },
      })),
    }),
    {
      name: 'knowledge-forge-settings',
      // Only persist LLM config (not chat messages or documents)
      partialize: (state) => ({
        llmConfig: state.llmConfig,
        useRag: state.useRag,
      }),
    }
  )
);
