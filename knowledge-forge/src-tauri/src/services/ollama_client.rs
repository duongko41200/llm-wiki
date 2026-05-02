use reqwest::Client;
use crate::models::{OllamaGenerateRequest, OllamaGenerateResponse, OllamaChatRequest, OllamaChatStreamResponse, OllamaChatMessage, QuizResponse, OllamaEmbedRequest, OllamaEmbedResponse};
use futures_util::StreamExt;
use tauri::Emitter;

const OLLAMA_GENERATE_URL: &str = "http://127.0.0.1:11434/api/generate";
const OLLAMA_EMBED_URL: &str = "http://127.0.0.1:11434/api/embed";
const OLLAMA_CHAT_URL: &str = "http://127.0.0.1:11434/api/chat";
const OLLAMA_PULL_URL: &str = "http://127.0.0.1:11434/api/pull";

const EMBED_MODEL: &str = "nomic-embed-text";
const CHAT_MODEL: &str = "qwen2.5:3b";

pub async fn ensure_embed_model(window: &tauri::Window) -> Result<(), String> {
    let client = Client::builder().timeout(std::time::Duration::from_secs(3)).build().unwrap_or_default();
    
    // Check if model exists
    let res = client.post(OLLAMA_GENERATE_URL)
        .json(&OllamaGenerateRequest {
            model: EMBED_MODEL.to_string(),
            prompt: "test".to_string(),
            stream: false,
            format: None,
        })
        .send().await;
        
    if let Ok(response) = res {
        if response.status().is_success() {
            return Ok(());
        }
    }
    
    // Model not found, pull it
    let _ = window.emit("ingest_progress", serde_json::json!({
        "status": "Đang tải mô hình nhúng (nomic-embed-text)... (chỉ một lần duy nhất)",
        "percent": 10
    }));
    
    let client = Client::new();
    let body = serde_json::json!({ "name": EMBED_MODEL, "stream": false });
    
    let pull_res = client.post(OLLAMA_PULL_URL).json(&body).send().await
        .map_err(|e| format!("Không thể kết nối Ollama để tải model: {}", e))?;
        
    if !pull_res.status().is_success() {
        return Err(format!("Lỗi khi tải model nhúng: {}", pull_res.status()));
    }
    
    Ok(())
}

pub async fn embed_texts(texts: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
    if texts.is_empty() {
        return Ok(Vec::new());
    }
    
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
        
    let req_body = OllamaEmbedRequest {
        model: EMBED_MODEL.to_string(),
        input: texts,
    };
    
    let res = client
        .post(OLLAMA_EMBED_URL)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send embed request to Ollama: {}", e))?;
        
    if !res.status().is_success() {
        return Err(format!("Ollama API returned status: {}", res.status()));
    }
    
    let ollama_response: OllamaEmbedResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama embed response: {}", e))?;
        
    Ok(ollama_response.embeddings)
}

pub async fn chat_stream(messages: Vec<OllamaChatMessage>, window: &tauri::Window) -> Result<(), String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    
    let req_body = OllamaChatRequest {
        model: CHAT_MODEL.to_string(),
        messages,
        stream: true,
        format: None,
    };

    let res = client
        .post(OLLAMA_CHAT_URL)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send chat request to Ollama: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama API returned status: {}", res.status()));
    }

    let mut stream = res.bytes_stream();
    
    while let Some(chunk_res) = stream.next().await {
        match chunk_res {
            Ok(bytes) => {
                let chunk_str = String::from_utf8_lossy(&bytes);
                for line in chunk_str.lines() {
                    if line.trim().is_empty() { continue; }
                    if let Ok(stream_res) = serde_json::from_str::<OllamaChatStreamResponse>(line) {
                        let _ = window.emit("chat_chunk", stream_res.message.content);
                    }
                }
            },
            Err(e) => println!("Error reading stream chunk: {}", e),
        }
    }
    
    let _ = window.emit("chat_done", ());
    Ok(())
}

pub async fn generate_quiz(context: &str) -> Result<QuizResponse, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    
    let prompt = format!(
        "Bạn là một trợ lý giáo dục. Hãy tạo một bài trắc nghiệm (quiz) gồm 5 câu hỏi dựa trên nội dung tài liệu sau. Trả về JSON theo cấu trúc chính xác sau:
{{
  \"title\": \"Tiêu đề bài trắc nghiệm\",
  \"questions\": [
    {{
      \"question\": \"Câu hỏi...\",
      \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"],
      \"correct_answer\": \"A\",
      \"explanation\": \"Giải thích tại sao...\"
    }}
  ]
}}

TÀI LIỆU:
{}",
        context
    );

    let req_body = OllamaGenerateRequest {
        model: CHAT_MODEL.to_string(),
        prompt,
        stream: false,
        format: Some("json".to_string()),
    };

    let res = client
        .post(OLLAMA_GENERATE_URL)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send quiz request: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama API returned status: {}", res.status()));
    }

    let ollama_response: OllamaGenerateResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let quiz: QuizResponse = serde_json::from_str(&ollama_response.response)
        .map_err(|e| format!("Failed to parse JSON from quiz generation: {}", e))?;

    Ok(quiz)
}
