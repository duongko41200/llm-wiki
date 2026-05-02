use std::path::Path;
use crate::models::{OllamaChatMessage, ChatHistoryMessage, LlmConfig, QuizResponse};
use super::{ollama_client, gemini_client, vector_store};

/// Rewrite user query using chat history for better retrieval
/// Only reformulates when necessary (has history + question is ambiguous)
async fn reformulate_query(
    config: &LlmConfig,
    history: &[ChatHistoryMessage],
    current_question: &str,
) -> String {
    // Skip reformulation if:
    // 1. No history (first message)
    // 2. Question is long enough to be self-contained (>15 words)
    // 3. Question doesn't contain pronouns/references needing context
    if history.is_empty() {
        return current_question.to_string();
    }

    let word_count = current_question.split_whitespace().count();
    if word_count > 15 {
        return current_question.to_string();
    }

    // Check for ambiguous pronouns / references in Vietnamese & English
    let ambiguous_indicators = [
        "nó", "chúng", "họ", "đó", "này", "kia", "vậy",
        "it", "they", "this", "that", "those", "these",
        "tại sao", "why", "how", "như thế nào", "thế nào",
    ];
    let q_lower = current_question.to_lowercase();
    let needs_reformulation = ambiguous_indicators.iter().any(|&w| q_lower.contains(w));

    if !needs_reformulation {
        return current_question.to_string();
    }

    // Build history summary (last 6 messages)
    let recent: Vec<String> = history.iter().rev().take(6).rev()
        .map(|m| format!("{}: {}", if m.role == "user" { "Người dùng" } else { "Trợ lý" }, m.content))
        .collect();
    let history_text = recent.join("\n");

    let prompt = format!(
        "Dựa vào lịch sử hội thoại dưới đây, hãy viết lại câu hỏi cuối cùng thành một câu tìm kiếm ĐỘC LẬP và ĐẦY ĐỦ ngữ cảnh (không cần đọc lịch sử để hiểu). Chỉ trả về câu tìm kiếm, không giải thích.\n\nLịch sử:\n{}\n\nCâu hỏi hiện tại: {}\n\nCâu tìm kiếm độc lập:",
        history_text, current_question
    );

    let result = match config.provider.as_str() {
        "gemini" => {
            if let Some(api_key) = &config.api_key {
                gemini_client::generate_single(api_key, &config.model, &prompt).await
            } else {
                Err("Gemini API key not provided".to_string())
            }
        }
        _ => ollama_client::generate_single(&config.model, &prompt).await,
    };

    match result {
        Ok(reformulated) => {
            let clean = reformulated.trim().to_string();
            if clean.is_empty() { current_question.to_string() } else { clean }
        }
        Err(_) => current_question.to_string(), // Fallback to original if reformulation fails
    }
}

pub async fn handle_chat_query(
    app_dir: &Path,
    message: String,
    mode: String,
    context_ids: Vec<String>,
    history: Vec<ChatHistoryMessage>,
    use_rag: bool,
    config: LlmConfig,
    window: &tauri::Window,
) -> Result<(), String> {
    
    let (system_prompt, final_messages) = match mode.as_str() {
        "compare" => {
            if context_ids.len() < 2 {
                return Err("Chế độ So sánh cần chọn ít nhất 2 tài liệu.".to_string());
            }
            
            let search_query = reformulate_query(&config, &history, &message).await;
            let question_embed = ollama_client::embed_texts(vec![search_query.clone()]).await?;
            let q_vec = question_embed.first().ok_or("Failed to embed question")?;
            
            let mut context_content = String::new();
            for doc_id in &context_ids {
                // top 3 chunks per doc to keep context small
                let chunks = vector_store::search_similar_chunks(app_dir, q_vec, Some(vec![doc_id.clone()]), 3)?;
                context_content.push_str(&format!("\n--- TÀI LIỆU {} ---\n", doc_id));
                for c in chunks {
                    // Truncate each chunk to 400 words max
                    let words: Vec<&str> = c.chunk.content.split_whitespace().collect();
                    let snippet = words[..words.len().min(400)].join(" ");
                    context_content.push_str(&format!("{}\n\n", snippet));
                }
            }
            
            let sys = format!(
                "Bạn là chuyên gia phân tích. Dựa trên các tài liệu sau, hãy trả lời câu hỏi và so sánh điểm giống/khác nhau. KHÔNG dùng kiến thức ngoài.\n\n{}",
                context_content
            );
            (sys, build_messages_with_history(&history, &message))
        },

        _ => { // "general" — RAG hoặc pure chat
            if use_rag {
                // Step 1: Reformulate query with history
                let search_query = reformulate_query(&config, &history, &message).await;

                // Step 2: Embed reformulated query and search
                let question_embed = ollama_client::embed_texts(vec![search_query]).await?;
                let q_vec = question_embed.first().ok_or("Failed to embed question")?;
                
                let doc_filter = if context_ids.is_empty() { None } else { Some(context_ids) };
                // Use top 4 chunks only — enough for accurate answer, much faster LLM processing
                let top_chunks = vector_store::search_similar_chunks(app_dir, q_vec, doc_filter, 4)?;
                
                // Step 3: Build context — truncate each chunk to 300 words for speed
                let mut context_content = String::new();
                for c in &top_chunks {
                    let words: Vec<&str> = c.chunk.content.split_whitespace().collect();
                    let snippet = words[..words.len().min(300)].join(" ");
                    context_content.push_str(&format!("[{}]\n{}\n\n", c.document_title, snippet));
                }
                
                let sys = if context_content.is_empty() {
                    "Trợ lý KnowledgeForge. Không tìm thấy nội dung liên quan trong tài liệu. Trả lời dựa trên kiến thức chung.".to_string()
                } else {
                    format!("Trợ lý KnowledgeForge. Trả lời dựa trên TÀI LIỆU bên dưới. Trích dẫn tên tài liệu. Không bịa.\n\n{}", context_content)
                };
                (sys, build_messages_with_history(&history, &message))
            } else {
                // Pure chat — không dùng RAG
                let sys = "Bạn là trợ lý thông minh KnowledgeForge. Hãy trả lời câu hỏi dựa trên kiến thức chung của bạn.".to_string();
                (sys, build_messages_with_history(&history, &message))
            }
        }
    };

    // Dispatch to appropriate LLM provider
    match config.provider.as_str() {
        "gemini" => {
            let api_key = config.api_key.as_deref()
                .ok_or("Gemini API Key chưa được cài đặt. Vui lòng vào Cài đặt để nhập API Key.")?;
            
            // Convert final_messages back to ChatHistoryMessage for Gemini
            // (skip system message, use system_prompt directly)
            let gemini_history: Vec<ChatHistoryMessage> = history.iter()
                .map(|m| ChatHistoryMessage { role: m.role.clone(), content: m.content.clone() })
                .collect();
            
            gemini_client::chat_stream(
                api_key,
                &config.model,
                &system_prompt,
                &gemini_history,
                &message,
                window,
            ).await
        }
        _ => {
            // Ollama: build full messages array [system + history + user]
            let mut ollama_msgs = vec![OllamaChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            }];
            for msg in &final_messages {
                ollama_msgs.push(msg.clone());
            }
            
            ollama_client::chat_stream(&config.model, ollama_msgs, window).await
        }
    }
}

/// Build Ollama-format messages from history + current message
fn build_messages_with_history(
    history: &[ChatHistoryMessage],
    current: &str,
) -> Vec<OllamaChatMessage> {
    // Keep only last 6 messages (3 exchanges) to avoid token bloat
    let trimmed_history = if history.len() > 6 {
        &history[history.len() - 6..]
    } else {
        history
    };
    let mut messages: Vec<OllamaChatMessage> = trimmed_history.iter()
        .map(|m| OllamaChatMessage { role: m.role.clone(), content: m.content.clone() })
        .collect();
    messages.push(OllamaChatMessage {
        role: "user".to_string(),
        content: current.to_string(),
    });
    messages
}

pub async fn handle_generate_quiz(
    app_dir: &Path,
    document_id: String,
    config: LlmConfig,
) -> Result<QuizResponse, String> {
    let chunks = vector_store::get_document_chunks(app_dir, &document_id)?;
    if chunks.is_empty() {
        return Err("Không tìm thấy nội dung nào của tài liệu này để tạo quiz.".to_string());
    }
    
    let mut context = String::new();
    let mut word_count = 0i64;
    for chunk in chunks.into_iter().take(8) {
        context.push_str(&chunk.content);
        context.push_str("\n\n");
        word_count += chunk.word_count;
        if word_count > 2500 { break; }
    }
    
    match config.provider.as_str() {
        "gemini" => {
            let api_key = config.api_key.as_deref()
                .ok_or("Gemini API Key chưa được cài đặt.")?;
            gemini_client::generate_quiz(api_key, &config.model, &context).await
        }
        _ => ollama_client::generate_quiz(&config.model, &context).await,
    }
}
