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

export interface ErrorNote {
  id: number;
  category: string;
  title: string;
  description: string;
  source: string | null;
  repeat_count: number;
  is_resolved: boolean;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: number;
  scheduled_date: string;
  task_type: string;
  task_title: string;
  task_description: string | null;
  duration_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ScheduleStats {
  current_streak: number;
  today_completed: number;
  today_total: number;
}

export interface WritingErrorDetail {
  error_type: string;
  original_text: string;
  corrected_text: string;
  explanation: string;
}

export interface WritingResult {
  task_response_score: number;
  grammar_score: number;
  vocabulary_score: number;
  coherence_score: number;
  overall_band: string;
  overall_feedback: string;
  errors: WritingErrorDetail[];
  sample_essay: string | null;
}

export interface SpeakingQuestion {
  part: number;
  scenario: string;
  questions: string[];
}

export interface SpeakingResult {
  grammar_score: number;
  vocabulary_score: number;
  pronunciation_score: number;
  fluency_score: number;
  overall_band: string;
  overall_feedback: string;
  errors: WritingErrorDetail[];
  improved_answer: string | null;
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

  // ── Error Notes ─────────────────────────────────────────────────────────
  errorNotes: ErrorNote[];
  errorNotesLoading: boolean;

  // ── Study Schedule ───────────────────────────────────────────────────────
  studyTasks: StudyTask[];
  scheduleStats: ScheduleStats | null;
  hasSeenSchedulePopup: boolean;

  // ── Chat ─────────────────────────────────────────────────────────────────
  chatMessages: ChatMessage[];
  chatMode: ChatMode;
  chatIsLoading: boolean;
  streamingContent: string;
  selectedContextIds: string[];
  useRag: boolean;

  // ── Writing Coach ────────────────────────────────────────────────────────
  writingResult: WritingResult | null;
  writingLoading: boolean;

  // ── Speaking Partner ──────────────────────────────────────────────────────
  speakingQuestion: SpeakingQuestion | null;
  speakingResult: SpeakingResult | null;
  speakingLoading: boolean;

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

  // ── Actions: Error Notes ──────────────────────────────────────────────────
  setErrorNotes: (notes: ErrorNote[]) => void;
  setErrorNotesLoading: (v: boolean) => void;
  addErrorNote: (note: ErrorNote) => void;
  updateNotePosition: (id: number, x: number, y: number) => void;
  updateNoteResolved: (id: number, is_resolved: boolean) => void;
  incrementNoteRepeat: (id: number) => void;
  removeErrorNote: (id: number) => void;

  // ── Actions: Study Schedule ───────────────────────────────────────────────
  setStudyTasks: (tasks: StudyTask[]) => void;
  setScheduleStats: (stats: ScheduleStats) => void;
  markTaskCompleted: (id: number) => void;
  setHasSeenSchedulePopup: (v: boolean) => void;

  // ── Actions: Chat ─────────────────────────────────────────────────────────
  addChatMessage: (msg: ChatMessage) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: () => void;
  setChatMode: (mode: ChatMode) => void;
  setChatLoading: (v: boolean) => void;
  setSelectedContextIds: (ids: string[]) => void;
  setUseRag: (v: boolean) => void;
  clearChat: () => void;

  // ── Actions: Writing Coach ───────────────────────────────────────────────
  setWritingResult: (result: WritingResult | null) => void;
  setWritingLoading: (v: boolean) => void;

  // ── Actions: Speaking Partner ────────────────────────────────────────────
  setSpeakingQuestion: (q: SpeakingQuestion | null) => void;
  setSpeakingResult: (result: SpeakingResult | null) => void;
  setSpeakingLoading: (v: boolean) => void;

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

      // Error notes defaults
      errorNotes: [],
      errorNotesLoading: false,

      // Study schedule defaults
      studyTasks: [],
      scheduleStats: null,
      hasSeenSchedulePopup: false,

      // Chat defaults
      chatMessages: [],
      chatMode: 'general',
      chatIsLoading: false,
      streamingContent: '',
      selectedContextIds: [],
      useRag: true,

      // Writing Coach defaults
      writingResult: null,
      writingLoading: false,

      // Speaking Partner defaults
      speakingQuestion: null,
      speakingResult: null,
      speakingLoading: false,

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

      // ── Error notes actions ──────────────────────────────────────────────
      setErrorNotes: (notes) => set({ errorNotes: notes }),
      setErrorNotesLoading: (v) => set({ errorNotesLoading: v }),
      addErrorNote: (note) => set((s) => ({ errorNotes: [note, ...s.errorNotes] })),
      updateNotePosition: (id, x, y) => set((s) => ({
        errorNotes: s.errorNotes.map(n => n.id === id ? { ...n, position_x: x, position_y: y } : n)
      })),
      updateNoteResolved: (id, is_resolved) => set((s) => ({
        errorNotes: s.errorNotes.map(n => n.id === id ? { ...n, is_resolved } : n)
      })),
      incrementNoteRepeat: (id) => set((s) => ({
        errorNotes: s.errorNotes.map(n => n.id === id ? { ...n, repeat_count: n.repeat_count + 1 } : n)
      })),
      removeErrorNote: (id) => set((s) => ({
        errorNotes: s.errorNotes.filter(n => n.id !== id)
      })),

      // ── Study schedule actions ────────────────────────────────────────────
      setStudyTasks: (tasks) => set({ studyTasks: tasks }),
      setScheduleStats: (stats) => set({ scheduleStats: stats }),
      markTaskCompleted: (id) => set((s) => ({
        studyTasks: s.studyTasks.map(t => t.id === id ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t)
      })),
      setHasSeenSchedulePopup: (v) => set({ hasSeenSchedulePopup: v }),

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

      // ── Writing Coach actions ──────────────────────────────────────────────
      setWritingResult: (result) => set({ writingResult: result }),
      setWritingLoading: (v) => set({ writingLoading: v }),

      // ── Speaking Partner actions ───────────────────────────────────────────
      setSpeakingQuestion: (q) => set({ speakingQuestion: q }),
      setSpeakingResult: (result) => set({ speakingResult: result }),
      setSpeakingLoading: (v) => set({ speakingLoading: v }),

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
