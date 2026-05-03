use std::path::PathBuf;
use crate::models::{LlmConfig};
use crate::services::{gemini_client, vector_store};

pub async fn summarize_document(
    app_dir: &PathBuf,
    document_id: &str,
    llm_config: LlmConfig,
) -> Result<String, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    // Lấy nội dung tài liệu từ vector store
    let chunks = vector_store::get_document_chunks(app_dir, document_id)?;
    if chunks.is_empty() {
        return Err("Tài liệu trống hoặc không tìm thấy.".into());
    }

    let mut full_text = String::new();
    for chunk in chunks {
        full_text.push_str(&chunk.content);
        full_text.push_str("\n\n");
    }

    let system_instruction = "You are an expert summarizer. Summarize the provided document comprehensively in Vietnamese. Highlight key points using bullet points.";
    let user_prompt = format!("Tài liệu:\n\n{}", full_text);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await
}

pub async fn explain_in_context(
    word: &str,
    sentence: &str,
    llm_config: LlmConfig,
) -> Result<String, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an expert English teacher. Explain the meaning of a word/phrase in the context of the provided sentence. Explain in Vietnamese, provide the pronunciation (IPA), meaning, and a usage example.";
    let user_prompt = format!("Word/Phrase: {}\nContext Sentence: {}", word, sentence);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await
}

pub async fn generate_reading_quiz(
    text: &str,
    llm_config: LlmConfig,
) -> Result<String, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an English teacher generating a reading comprehension quiz based on the provided text.
Generate 3 multiple choice questions.
Return ONLY a JSON array of objects:
[
  {
    \"question\": \"string\",
    \"options\": [\"string\", \"string\", \"string\", \"string\"],
    \"correct_index\": number,
    \"explanation\": \"string\"
  }
]";
    let user_prompt = format!("Text:\n\n{}", text);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await
}
