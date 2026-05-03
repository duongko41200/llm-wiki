use serde::{Deserialize, Serialize};

// ─── Vector / Chunk models ────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChunkData {
    pub chunk_index: usize,
    pub content: String,
    pub word_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChunkRecord {
    pub id: i64,
    pub document_id: String,
    pub chunk_index: i64,
    pub content: String,
    pub embedding: Option<Vec<f32>>,
    pub word_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoredChunk {
    pub chunk: ChunkRecord,
    pub score: f32,
    pub document_title: String,
}

// ─── Ingest models ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IngestResult {
    pub document_id: String,
    pub status: String,
    pub chunks_count: usize,
    pub error_message: Option<String>,
}

// ─── LLM Provider config (sent from Frontend) ─────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmConfig {
    pub provider: String,         // "ollama" | "gemini"
    pub model: String,            // "qwen2.5:3b" | "gemini-2.0-flash" etc.
    pub api_key: Option<String>,  // Required for Gemini
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            provider: "ollama".to_string(),
            model: "qwen2.5:3b".to_string(),
            api_key: None,
        }
    }
}

// ─── Chat history message (from Frontend) ─────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatHistoryMessage {
    pub role: String,    // "user" | "assistant"
    pub content: String,
}

// ─── Ollama models ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaEmbedRequest {
    pub model: String,
    pub input: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaEmbedResponse {
    pub embeddings: Vec<Vec<f32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaGenerateRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    pub format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaGenerateResponse {
    pub model: String,
    pub created_at: String,
    pub response: String,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaChatRequest {
    pub model: String,
    pub messages: Vec<OllamaChatMessage>,
    pub stream: bool,
    pub format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaChatStreamResponse {
    pub model: String,
    pub created_at: String,
    pub message: OllamaChatMessage,
    pub done: bool,
}

// ─── Gemini models ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiContent {
    /// For system_instruction this should be omitted (empty string → skip)
    #[serde(skip_serializing_if = "String::is_empty")]
    pub role: String,
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiRequest {
    pub contents: Vec<GeminiContent>,
    #[serde(rename = "systemInstruction", skip_serializing_if = "Option::is_none")]
    pub system_instruction: Option<GeminiContent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiStreamChunk {
    pub candidates: Option<Vec<GeminiCandidate>>,
    // Ignore usageMetadata and other fields
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiCandidate {
    pub content: Option<GeminiContent>,
    #[serde(rename = "finishReason")]
    pub finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiEmbedRequest {
    pub model: String,
    pub content: GeminiContent,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiEmbedResponse {
    pub embedding: GeminiEmbedding,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiEmbedding {
    pub values: Vec<f32>,
}

// ─── Quiz models ──────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct QuizQuestion {
    pub question: String,
    pub options: Vec<String>,
    pub correct_answer: String,
    pub explanation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuizResponse {
    pub title: String,
    pub questions: Vec<QuizQuestion>,
}

// ─── Error Notes ──────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorNote {
    pub id: i64,
    pub category: String,
    pub title: String,
    pub description: String,
    pub source: Option<String>,
    pub repeat_count: i64,
    pub is_resolved: bool,
    pub position_x: f64,
    pub position_y: f64,
    pub created_at: String,
    pub updated_at: String,
}

// ─── Study Schedule ───────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudyTask {
    pub id: i64,
    pub scheduled_date: String,
    pub task_type: String,
    pub task_title: String,
    pub task_description: Option<String>,
    pub duration_minutes: i64,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScheduleStats {
    pub current_streak: i64,
    pub today_completed: usize,
    pub today_total: usize,
}

// ─── Writing & Speaking Results ───────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WritingErrorDetail {
    pub error_type: String, // grammar, vocabulary, spelling, punctuation
    pub original_text: String,
    pub corrected_text: String,
    pub explanation: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WritingResult {
    pub task_response_score: f64,
    pub grammar_score: f64,
    pub vocabulary_score: f64,
    pub coherence_score: f64,
    pub overall_band: String, // e.g., A2, B1, B2, C1
    pub overall_feedback: String,
    pub errors: Vec<WritingErrorDetail>,
    pub sample_essay: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillResult {
    pub id: i64,
    pub skill_type: String,
    pub score_task: Option<f64>,
    pub score_grammar: Option<f64>,
    pub score_vocabulary: Option<f64>,
    pub score_coherence: Option<f64>,
    pub score_pronunciation: Option<f64>,
    pub total_score: Option<f64>,
    pub feedback: String, // JSON serialized
    pub user_input: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpeakingQuestion {
    pub part: u8,
    pub scenario: String,
    pub questions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpeakingResult {
    pub grammar_score: f64,
    pub vocabulary_score: f64,
    pub pronunciation_score: f64,
    pub fluency_score: f64,
    pub overall_band: String,
    pub overall_feedback: String,
    pub errors: Vec<WritingErrorDetail>, // Reuse same error struct
    pub improved_answer: Option<String>,
}
