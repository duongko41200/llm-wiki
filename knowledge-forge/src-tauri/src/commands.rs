use tauri::Manager;
use reqwest::Client;
use crate::services::{ingest_engine, wiki_engine, chat_engine};

/// Check if Ollama process is running (API accessible)
#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    let client = Client::new();
    match client.get("http://127.0.0.1:11434/api/tags").send().await {
        Ok(res) => Ok(res.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// Check if Ollama binary is installed on the system
#[tauri::command]
pub async fn check_ollama_installed() -> bool {
    std::process::Command::new("ollama")
        .arg("--version")
        .output()
        .is_ok()
}

/// Start ollama serve as a background process
#[tauri::command]
pub async fn start_ollama_serve(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    // Spawn ollama serve — it will keep running in background
    app.shell()
        .command("ollama")
        .args(["serve"])
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {}", e))?;
    // Wait a moment for it to boot up
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    Ok(())
}

/// Install Ollama via winget (Windows Package Manager) with streaming progress events
#[tauri::command]
pub async fn install_ollama(window: tauri::Window) -> Result<(), String> {
    use tauri::Emitter;
    use tauri_plugin_shell::ShellExt;

    let app = window.app_handle();

    let _ = window.emit("ollama_install_progress", serde_json::json!({
        "status": "Đang kiểm tra winget...",
        "percent": 2
    }));

    // Try winget first (available on Windows 10 1709+ and Windows 11)
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
                    // Bump progress on any output
                    percent = (percent + 5).min(90);
                    let _ = window.emit("ollama_install_progress", serde_json::json!({
                        "status": text.trim(),
                        "percent": percent
                    }));
                }
                CommandEvent::Terminated(status) => {
                    if status.code == Some(0) || status.code == Some(-1978335189) {
                        // -1978335189 = APPINSTALLER_ERROR_ALREADY_INSTALLED (OK)
                        let _ = window.emit("ollama_install_progress", serde_json::json!({
                            "status": "Cài đặt hoàn tất!",
                            "percent": 100
                        }));
                        let _ = window.emit("ollama_install_launched", ());
                        return Ok(());
                    } else {
                        // winget failed, fall through to BITS fallback
                        break;
                    }
                }
                _ => {}
            }
        }
    }

    // Fallback: use PowerShell BITS transfer (handles resume + large files)
    let _ = window.emit("ollama_install_progress", serde_json::json!({
        "status": "Đang tải qua BITS (hỗ trợ tiếp tục nếu ngắt mạng)...",
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



/// Pull an Ollama model, streaming download progress via Tauri events
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
                    // Emit raw JSON line to frontend
                    let _ = window.emit("ollama_pull_progress", line);
                }
            }
            Err(e) => return Err(format!("Stream error: {}", e)),
        }
    }

    let _ = window.emit("ollama_pull_done", &model);
    Ok(())
}

#[tauri::command]
pub async fn get_settings() -> Result<String, String> {
    // Placeholder for Phase 1
    Ok("{}".to_string())
}

#[tauri::command]
pub async fn parse_document(app: tauri::AppHandle, input_path: String, file_type: String, output_path: String) -> Result<String, String> {
    use tauri_plugin_shell::ShellExt;
    
    let sidecar_command = app.shell().sidecar("parser").map_err(|e| e.to_string())?;
    
    let output = sidecar_command
        .args(["--input", &input_path, "--type", &file_type, "--output", &output_path])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8(output.stdout).unwrap_or_default())
    } else {
        Err(String::from_utf8(output.stderr).unwrap_or_default())
    }
}

#[tauri::command]
pub async fn ingest_document(app: tauri::AppHandle, document_id: String, raw_path: String) -> Result<crate::models::IngestResult, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    ingest_engine::run_ingest_pipeline(&app_dir, &document_id, &raw_path).await
}

#[tauri::command]
pub async fn get_wiki_index(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    wiki_engine::read_index(&app_dir)
}

#[tauri::command]
pub async fn send_chat_message(
    app: tauri::AppHandle, 
    window: tauri::Window, 
    message: String, 
    mode: String, 
    context_ids: Vec<String>
) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    chat_engine::handle_chat_query(&app_dir, message, mode, context_ids, &window).await
}

#[tauri::command]
pub async fn generate_quiz(app: tauri::AppHandle, document_id: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    chat_engine::handle_generate_quiz(&app_dir, document_id).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_settings_returns_json() {
        let result = get_settings().await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "{}");
    }
}
