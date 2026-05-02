use tauri::Manager;
use reqwest::Client;
use crate::services::{ingest_engine, chat_engine, vector_store, web_scraper};
use crate::models::{ChunkRecord, LlmConfig, ChatHistoryMessage, IngestResult};

// ─── Ollama Status ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .unwrap_or_default();
    match client.get("http://127.0.0.1:11434/api/tags").send().await {
        Ok(res) => Ok(res.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn check_ollama_installed() -> bool {
    std::process::Command::new("ollama")
        .arg("--version")
        .output()
        .is_ok()
}

#[tauri::command]
pub async fn start_ollama_serve(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    app.shell()
        .command("ollama")
        .args(["serve"])
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    Ok(())
}

#[tauri::command]
pub async fn install_ollama(window: tauri::Window) -> Result<(), String> {
    use tauri::Emitter;
    use tauri_plugin_shell::ShellExt;

    let app = window.app_handle();

    let _ = window.emit("ollama_install_progress", serde_json::json!({
        "status": "Đang kiểm tra winget...",
        "percent": 2
    }));

    let winget_check = std::process::Command::new("winget")
        .args(["--version"])
        .output();

    if winget_check.is_ok() {
        let _ = window.emit("ollama_install_progress", serde_json::json!({
            "status": "Đang cài qua Windows Package Manager (winget)...",
            "percent": 10
        }));

        let (mut rx, _child) = app.shell()
            .command("winget")
            .args(["install", "--id", "Ollama.Ollama", "--silent", "--accept-package-agreements", "--accept-source-agreements"])
            .spawn()
            .map_err(|e| format!("Không thể chạy winget: {}", e))?;

        use tauri_plugin_shell::process::CommandEvent;
        let mut percent = 10u32;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    percent = (percent + 5).min(90);
                    let _ = window.emit("ollama_install_progress", serde_json::json!({
                        "status": text.trim(),
                        "percent": percent
                    }));
                }
                CommandEvent::Terminated(status) => {
                    if status.code == Some(0) || status.code == Some(-1978335189) {
                        let _ = window.emit("ollama_install_progress", serde_json::json!({
                            "status": "Cài đặt hoàn tất!",
                            "percent": 100
                        }));
                        let _ = window.emit("ollama_install_launched", ());
                        return Ok(());
                    } else {
                        break;
                    }
                }
                _ => {}
            }
        }
    }

    let _ = window.emit("ollama_install_progress", serde_json::json!({
        "status": "Đang tải qua BITS...",
        "percent": 5
    }));

    let tmp = std::env::temp_dir().join("OllamaSetup.exe");
    let tmp_str = tmp.to_string_lossy().to_string();
    let ps_script = format!(
        "Start-BitsTransfer -Source 'https://ollama.com/download/OllamaSetup.exe' -Destination '{}'; Start-Process '{}'",
        tmp_str, tmp_str
    );

    let (mut rx, _child) = app.shell()
        .command("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
        .spawn()
        .map_err(|e| format!("Không thể chạy PowerShell: {}", e))?;

    use tauri_plugin_shell::process::CommandEvent;
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Terminated(status) = event {
            if status.code == Some(0) {
                let _ = window.emit("ollama_install_progress", serde_json::json!({
                    "status": "Tải xong! Trình cài đặt đang chạy...",
                    "percent": 100
                }));
                let _ = window.emit("ollama_install_launched", ());
                return Ok(());
            } else {
                return Err("Tải thất bại. Vui lòng tải thủ công từ https://ollama.com/download".to_string());
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn pull_ollama_model(window: tauri::Window, model: String) -> Result<(), String> {
    use tauri::Emitter;
    use futures_util::StreamExt;

    let client = Client::new();
    let body = serde_json::json!({ "name": model, "stream": true });

    let res = client
        .post("http://127.0.0.1:11434/api/pull")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Cannot reach Ollama: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama pull failed with status: {}", res.status()));
    }

    let mut stream = res.bytes_stream();
    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                for line in text.lines() {
                    if line.trim().is_empty() { continue; }
                    let _ = window.emit("ollama_pull_progress", line);
                }
            }
            Err(e) => return Err(format!("Stream error: {}", e)),
        }
    }

    let _ = window.emit("ollama_pull_done", &model);
    Ok(())
}

// ─── Settings ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_settings() -> Result<String, String> {
    Ok("{}".to_string())
}

// ─── Ingest (File) ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn ingest_document(
    app: tauri::AppHandle,
    window: tauri::Window,
    document_id: String,
    raw_path: String,
) -> Result<IngestResult, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    ingest_engine::run_rag_ingest(&app_dir, &document_id, &raw_path, &window).await
}

// ─── Ingest (URL) — NEW ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn ingest_url(
    app: tauri::AppHandle,
    window: tauri::Window,
    url: String,
    document_id: String,
) -> Result<IngestResult, String> {
    use tauri::Emitter;
    
    let _ = window.emit("ingest_progress", serde_json::json!({
        "status": "Đang tải nội dung từ URL...",
        "percent": 5
    }));

    let text = web_scraper::fetch_url_as_text(&url).await?;
    
    let _ = window.emit("ingest_progress", serde_json::json!({
        "status": "Đang xử lý và nhúng nội dung...",
        "percent": 20
    }));

    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Write text to a temp buffer and pass to ingest pipeline directly
    ingest_engine::run_rag_ingest_text(&app_dir, &document_id, &text, &window).await
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn send_chat_message(
    app: tauri::AppHandle,
    window: tauri::Window,
    message: String,
    mode: String,
    context_ids: Vec<String>,
    history: Vec<ChatHistoryMessage>,
    use_rag: bool,
    llm_config: LlmConfig,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    chat_engine::handle_chat_query(
        &app_dir, message, mode, context_ids, history, use_rag, llm_config, &window
    ).await
}

// ─── Quiz ──────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn generate_quiz(
    app: tauri::AppHandle,
    document_id: String,
    llm_config: LlmConfig,
) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let quiz = chat_engine::handle_generate_quiz(&app_dir, document_id, llm_config).await?;
    serde_json::to_string(&quiz).map_err(|e| format!("Failed to serialize quiz: {}", e))
}

// ─── Document Management ───────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_document_chunks(
    app: tauri::AppHandle,
    document_id: String,
) -> Result<Vec<ChunkRecord>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    vector_store::get_document_chunks(&app_dir, &document_id)
}

#[tauri::command]
pub async fn delete_document(
    app: tauri::AppHandle,
    document_id: String,
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    vector_store::delete_document_from_db(&app_dir, &document_id)
}
