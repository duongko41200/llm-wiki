use serde::{Deserialize, Serialize};

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
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IngestResult {
    pub document_id: String,
    pub status: String,
    pub chunks_count: usize,
    pub error_message: Option<String>,
}

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
