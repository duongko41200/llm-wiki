import { create } from 'zustand';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  createdAt: number;
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Documents / Upload tab ──────────────────────────────────────────────
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

  // ── Chat tab ─────────────────────────────────────────────────────────────
  chatMessages: ChatMessage[];
  chatMode: ChatMode;
  chatIsLoading: boolean;
  streamingContent: string;
  selectedContextIds: string[];

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
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
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

  // ── Upload actions ─────────────────────────────────────────────────────────
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

  // ── Chat actions ───────────────────────────────────────────────────────────
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
}));
