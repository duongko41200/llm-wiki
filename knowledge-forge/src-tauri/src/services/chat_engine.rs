use std::path::Path;
use crate::models::OllamaChatMessage;
use super::ollama_client;
use super::wiki_engine;

pub async fn handle_chat_query(
    app_dir: &Path,
    message: String,
    mode: String,
    context_ids: Vec<String>,
    window: &tauri::Window,
) -> Result<(), String> {
    
    let system_prompt = match mode.as_str() {
        "compare" => {
            if context_ids.len() < 2 {
                return Err("Compare mode requires at least 2 context IDs (source names).".to_string());
            }
            
            let mut context_content = String::new();
            for id in &context_ids {
                if let Ok(content) = wiki_engine::get_source_content(app_dir, id) {
                    context_content.push_str(&format!("\n--- TÀI LIỆU: {} ---\n{}\n", id, content));
                }
            }
            
            format!(
                "Bạn là chuyên gia phân tích. Dựa trên các tài liệu sau, hãy so sánh điểm giống nhau, khác nhau và rút ra kết luận. KHÔNG dùng kiến thức ngoài.\n\n{}",
                context_content
            )
        },
        _ => { // "general" or anything else
            // Find relevant context from wiki
            let context = wiki_engine::search_wiki(app_dir, &message)?;
            
            format!(
                "Bạn là trợ lý hệ thống KnowledgeForge. Trả lời DỰA TRÊN context wiki bên dưới. Nếu không đủ thông tin, hãy nói rõ. KHÔNG bịa thông tin.\n\nWIKI CONTEXT:\n{}",
                context
            )
        }
    };
    
    let messages = vec![
        OllamaChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        },
        OllamaChatMessage {
            role: "user".to_string(),
            content: message,
        }
    ];
    
    ollama_client::chat_stream(messages, window).await
}

pub async fn handle_generate_quiz(
    app_dir: &Path,
    document_id: String, // Treat this as the source name for now
) -> Result<String, String> {
    let context = wiki_engine::get_source_content(app_dir, &document_id)?;
    let quiz = ollama_client::generate_quiz(&context).await?;
    
    // Serialize to string to pass back to frontend
    serde_json::to_string(&quiz).map_err(|e| format!("Failed to serialize quiz: {}", e))
}
