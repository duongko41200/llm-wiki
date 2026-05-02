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
