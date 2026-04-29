use reqwest::Client;
use crate::models::{ExtractedKnowledge, OllamaGenerateRequest, OllamaGenerateResponse, OllamaChatRequest, OllamaChatStreamResponse, OllamaChatMessage, QuizResponse};
use futures_util::StreamExt;
use tauri::Emitter;

const OLLAMA_URL: &str = "http://127.0.0.1:11434/api/generate";

pub async fn generate_knowledge(raw_markdown: &str) -> Result<ExtractedKnowledge, String> {
    let client = Client::new();
    
    let prompt = format!(
        "Bạn là trợ lý trích xuất kiến thức. Đọc tài liệu sau và trả về JSON:
{{
  \"summary\": \"2-3 đoạn tóm tắt\",
  \"key_takeaways\": [\"...\"],
  \"entities\": [{{\"name\": \"...\", \"type\": \"person|org|tool\", \"description\": \"...\"}}],
  \"concepts\": [{{\"name\": \"...\", \"definition\": \"...\", \"domain\": \"...\"}}],
  \"quotes\": [\"...\"]
}}

TÀI LIỆU:
{}",
        raw_markdown
    );

    let req_body = OllamaGenerateRequest {
        model: "qwen2.5:3b".to_string(), // Default model
        prompt,
        stream: false,
        format: Some("json".to_string()),
    };

    let res = client
        .post(OLLAMA_URL)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request to Ollama: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama API returned status: {}", res.status()));
    }

    let ollama_response: OllamaGenerateResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let extracted: ExtractedKnowledge = serde_json::from_str(&ollama_response.response)
        .map_err(|e| format!("Failed to parse JSON from Ollama generation: {}", e))?;

    Ok(extracted)
}

pub async fn chat_stream(messages: Vec<OllamaChatMessage>, window: &tauri::Window) -> Result<(), String> {
    let client = Client::new();
    
    let req_body = OllamaChatRequest {
        model: "llama3.1:8b".to_string(), // Better model for chat
        messages,
        stream: true,
        format: None,
    };

    let res = client
        .post("http://127.0.0.1:11434/api/chat")
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
                // Ollama streams JSON lines
                for line in chunk_str.lines() {
                    if line.trim().is_empty() {
                        continue;
                    }
                    
                    if let Ok(stream_res) = serde_json::from_str::<OllamaChatStreamResponse>(line) {
                        // Emit event to the window
                        if let Err(e) = window.emit("chat_chunk", stream_res.message.content) {
                            println!("Failed to emit chunk: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                println!("Error reading stream chunk: {}", e);
            }
        }
    }
    
    // Emit done event
    let _ = window.emit("chat_done", ());

    Ok(())
}

pub async fn generate_quiz(context: &str) -> Result<QuizResponse, String> {
    let client = Client::new();
    
    let prompt = format!(
        "Bạn là một trợ lý giáo dục. Hãy tạo một bài trắc nghiệm (quiz) gồm 5 câu hỏi dựa trên nội dung tài liệu sau. Trả về JSON theo cấu trúc chính xác sau:
{{
  \"title\": \"Tiêu đề bài trắc nghiệm\",
  \"questions\": [
    {{
      \"question\": \"Câu hỏi...\",
      \"options\": [\"A\", \"B\", \"C\", \"D\"],
      \"correct_answer\": 0, // index của câu đúng (0-3)
      \"explanation\": \"Giải thích tại sao...\"
    }}
  ]
}}

TÀI LIỆU:
{}",
        context
    );

    let req_body = OllamaGenerateRequest {
        model: "qwen2.5:7b".to_string(), // 7B is better for structured generation
        prompt,
        stream: false,
        format: Some("json".to_string()),
    };

    let res = client
        .post(OLLAMA_URL)
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
