use std::path::Path;
use crate::models::{OllamaChatMessage};
use super::ollama_client;
use super::vector_store;

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
            
            // For comparison, get top chunks from the selected documents specifically
            let question_embed = ollama_client::embed_texts(vec![message.clone()]).await?;
            let q_vec = question_embed.first().ok_or("Failed to embed question")?;
            
            // Get top 5 chunks from only the selected documents
            let mut context_content = String::new();
            for doc_id in &context_ids {
                let chunks = vector_store::search_similar_chunks(app_dir, q_vec, Some(vec![doc_id.clone()]), 5)?;
                
                context_content.push_str(&format!("\n--- TÀI LIỆU {} ---\n", doc_id));
                for c in chunks {
                    context_content.push_str(&format!("{}\n\n", c.chunk.content));
                }
            }
            
            format!(
                "Bạn là chuyên gia phân tích. Dựa trên các tài liệu sau, hãy trả lời câu hỏi và so sánh điểm giống/khác nhau. KHÔNG dùng kiến thức ngoài.\n\n{}",
                context_content
            )
        },
        _ => { // "general" or anything else
            // 1. Embed query
            let question_embed = ollama_client::embed_texts(vec![message.clone()]).await?;
            let q_vec = question_embed.first().ok_or("Failed to embed question")?;
            
            // 2. Search relevant chunks
            let doc_filter = if context_ids.is_empty() { None } else { Some(context_ids) };
            let top_chunks = vector_store::search_similar_chunks(app_dir, q_vec, doc_filter, 8)?;
            
            // 3. Build context
            let mut context_content = String::new();
            for c in top_chunks {
                context_content.push_str(&format!("[Tài liệu: {}] {}\n\n", c.document_title, c.chunk.content));
            }
            
            if context_content.is_empty() {
                "Bạn là trợ lý hệ thống KnowledgeForge. Trả lời một cách ngắn gọn. Hiện không tìm thấy thông tin nào liên quan trong tài liệu.".to_string()
            } else {
                format!(
                    "Bạn là trợ lý hệ thống KnowledgeForge. Trả lời DỰA TRÊN các đoạn tài liệu sau đây. Nếu không đủ thông tin, hãy nói rõ. Luôn trích dẫn tên tài liệu nếu có thể. KHÔNG bịa thông tin.\n\nTÀI LIỆU:\n{}",
                    context_content
                )
            }
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
    document_id: String,
) -> Result<String, String> {
    // Lấy tất cả chunks của document này
    let chunks = vector_store::get_document_chunks(app_dir, &document_id)?;
    if chunks.is_empty() {
        return Err("Không tìm thấy nội dung nào của tài liệu này để tạo quiz.".to_string());
    }
    
    // Đảo ngẫu nhiên hoặc lấy các chunks trải đều để quiz bao quát
    // Đơn giản nhất là ghép lại ~2000 từ để sinh quiz
    let mut context = String::new();
    let mut word_count = 0;
    
    // Lấy ngẫu nhiên vài chunk (hoặc lấy 5 chunk đầu)
    for chunk in chunks.into_iter().take(8) {
        context.push_str(&chunk.content);
        context.push_str("\n\n");
        word_count += chunk.word_count;
        if word_count > 2500 { break; } // Tránh context quá dài
    }
    
    let quiz = ollama_client::generate_quiz(&context).await?;
    
    // Serialize to string to pass back to frontend
    serde_json::to_string(&quiz).map_err(|e| format!("Failed to serialize quiz: {}", e))
}
