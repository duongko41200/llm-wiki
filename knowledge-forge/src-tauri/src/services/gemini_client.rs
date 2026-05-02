use reqwest::Client;
use crate::models::{
    GeminiRequest, GeminiContent, GeminiPart, GeminiStreamChunk,
    GeminiEmbedRequest, GeminiEmbedResponse, QuizResponse,
    ChatHistoryMessage,
};
use futures_util::StreamExt;
use tauri::Emitter;

const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models";

fn build_url(api_key: &str, model: &str, action: &str) -> String {
    format!("{}/{}:{}?key={}", GEMINI_BASE_URL, model, action, api_key)
}



/// Convert chat history to Gemini content format
fn history_to_gemini(history: &[ChatHistoryMessage]) -> Vec<GeminiContent> {
    history.iter().map(|msg| GeminiContent {
        role: if msg.role == "assistant" { "model".to_string() } else { "user".to_string() },
        parts: vec![GeminiPart { text: msg.content.clone() }],
    }).collect()
}

/// Parse text from a Gemini SSE stream chunk line (data: {...})
/// Gemini SSE format:
///   data: {"candidates":[{"content":{"parts":[{"text":"hello"}],...},...}]}
fn extract_text_from_sse_line(line: &str) -> Option<String> {
    // Strip "data: " prefix
    let json_str = if line.starts_with("data: ") {
        &line["data: ".len()..]
    } else if line.starts_with('{') {
        // Raw JSON line (older API format)
        line
    } else {
        return None;
    };

    let json_str = json_str.trim();
    if json_str.is_empty() || json_str == "[DONE]" {
        return None;
    }

    // Try to deserialize as GeminiStreamChunk
    match serde_json::from_str::<GeminiStreamChunk>(json_str) {
        Ok(chunk) => {
            let mut text = String::new();
            if let Some(candidates) = chunk.candidates {
                for candidate in candidates {
                    // Skip thinking content (Gemini 2.5 thinking tokens)
                    if let Some(ref reason) = candidate.finish_reason {
                        if reason == "STOP" {
                            // normal end — still collect text
                        }
                    }
                    if let Some(content) = candidate.content {
                        for part in content.parts {
                            if !part.text.is_empty() {
                                text.push_str(&part.text);
                            }
                        }
                    }
                }
            }
            if text.is_empty() { None } else { Some(text) }
        }
        Err(_) => None,
    }
}

pub async fn chat_stream(
    api_key: &str,
    model: &str,
    system_prompt: &str,
    history: &[ChatHistoryMessage],
    user_message: &str,
    window: &tauri::Window,
) -> Result<(), String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // Use alt=sse query param to get proper Server-Sent Events format
    let url = format!("{}/{}:streamGenerateContent?alt=sse&key={}",
        GEMINI_BASE_URL, model, api_key);

    // Build contents from history + current message
    let mut contents = history_to_gemini(history);
    contents.push(GeminiContent {
        role: "user".to_string(),
        parts: vec![GeminiPart { text: user_message.to_string() }],
    });

    // system_instruction role must be blank string for Gemini API (not "user")
    let system_instruction = if !system_prompt.is_empty() {
        Some(GeminiContent {
            role: String::new(), // Gemini system instruction has no role field
            parts: vec![GeminiPart { text: system_prompt.to_string() }],
        })
    } else {
        None
    };

    let req_body = GeminiRequest {
        contents,
        system_instruction,
    };

    let res = client
        .post(&url)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối Gemini API: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        // Extract error message from JSON if possible
        let user_err = if let Ok(json) = serde_json::from_str::<serde_json::Value>(&err_text) {
            json["error"]["message"].as_str().unwrap_or(&err_text).to_string()
        } else {
            err_text
        };
        return Err(format!("Gemini API lỗi {}: {}", status, user_err));
    }

    let mut stream = res.bytes_stream();
    // Line-buffer for SSE — chunks may split lines
    let mut line_buf = String::new();

    while let Some(chunk_res) = stream.next().await {
        match chunk_res {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                line_buf.push_str(&text);

                // Process complete lines
                loop {
                    if let Some(newline_pos) = line_buf.find('\n') {
                        let line = line_buf[..newline_pos].trim_end_matches('\r').to_string();
                        line_buf = line_buf[newline_pos + 1..].to_string();

                        if line.is_empty() {
                            continue; // SSE empty line separator — skip
                        }

                        if let Some(text_chunk) = extract_text_from_sse_line(&line) {
                            let _ = window.emit("chat_chunk", &text_chunk);
                        }
                    } else {
                        break; // Incomplete line — wait for more data
                    }
                }
            }
            Err(e) => println!("Gemini stream chunk error: {}", e),
        }
    }

    // Process any remaining data in buffer
    if !line_buf.trim().is_empty() {
        if let Some(text_chunk) = extract_text_from_sse_line(line_buf.trim()) {
            let _ = window.emit("chat_chunk", &text_chunk);
        }
    }

    let _ = window.emit("chat_done", ());
    Ok(())
}

/// Non-streaming single generation (cho Query Reformulation, Quiz)
pub async fn generate_single(api_key: &str, model: &str, prompt: &str) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let url = build_url(api_key, model, "generateContent");

    let req_body = GeminiRequest {
        contents: vec![GeminiContent {
            role: "user".to_string(),
            parts: vec![GeminiPart { text: prompt.to_string() }],
        }],
        system_instruction: None,
    };

    let res = client
        .post(&url)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối Gemini API: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        let user_err = if let Ok(json) = serde_json::from_str::<serde_json::Value>(&err_text) {
            json["error"]["message"].as_str().unwrap_or(&err_text).to_string()
        } else {
            err_text
        };
        return Err(format!("Gemini API lỗi {}: {}", status, user_err));
    }

    let val: serde_json::Value = res.json().await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    // Collect all text parts (Gemini 2.5 may return multiple parts including thinking)
    let mut full_text = String::new();
    if let Some(candidates) = val["candidates"].as_array() {
        for candidate in candidates {
            if let Some(parts) = candidate["content"]["parts"].as_array() {
                for part in parts {
                    if let Some(text) = part["text"].as_str() {
                        full_text.push_str(text);
                    }
                }
            }
        }
    }

    Ok(full_text)
}

/// Embed text using Gemini embedding model
/// Note: embedding uses text-embedding-004, NOT gemini-2.5-flash
pub async fn embed_text(api_key: &str, text: &str) -> Result<Vec<f32>, String> {
    let embed_model = "text-embedding-004";
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let url = format!("{}/{}:embedContent?key={}", GEMINI_BASE_URL, embed_model, api_key);

    let req_body = GeminiEmbedRequest {
        model: format!("models/{}", embed_model),
        content: GeminiContent {
            role: "user".to_string(),
            parts: vec![GeminiPart { text: text.to_string() }],
        },
    };

    let res = client
        .post(&url)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Gemini embed request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini embed error {}: {}", status, err_text));
    }

    let response: GeminiEmbedResponse = res.json().await
        .map_err(|e| format!("Failed to parse Gemini embed response: {}", e))?;

    Ok(response.embedding.values)
}

/// Generate quiz using Gemini (non-streaming for clean JSON output)
pub async fn generate_quiz(api_key: &str, model: &str, context: &str) -> Result<QuizResponse, String> {
    let prompt = format!(
        "Bạn là một trợ lý giáo dục. Hãy tạo một bài trắc nghiệm (quiz) gồm 5 câu hỏi dựa trên nội dung tài liệu sau.\n\nYêu cầu:\n- Trả về JSON THUẦN TÚY, KHÔNG có markdown code fence (```)\n- Cấu trúc JSON chính xác như sau:\n{{\"title\":\"Tiêu đề bài quiz\",\"questions\":[{{\"question\":\"Câu hỏi\",\"options\":[\"A. Lựa chọn A\",\"B. Lựa chọn B\",\"C. Lựa chọn C\",\"D. Lựa chọn D\"],\"correct_answer\":\"A\",\"explanation\":\"Giải thích tại sao đáp án đúng\"}}]}}\n\nTÀI LIỆU:\n{}",
        context
    );

    let text = generate_single(api_key, model, &prompt).await?;

    // Strip possible markdown code fences (Gemini sometimes adds them despite instructions)
    let clean = text.trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    // Find first { and last } to extract JSON even if there's surrounding text
    let json_str = if let (Some(start), Some(end)) = (clean.find('{'), clean.rfind('}')) {
        &clean[start..=end]
    } else {
        clean
    };

    serde_json::from_str::<QuizResponse>(json_str)
        .map_err(|e| format!("Failed to parse Gemini quiz JSON: {} — Raw response: {}", e, &text[..text.len().min(300)]))
}
