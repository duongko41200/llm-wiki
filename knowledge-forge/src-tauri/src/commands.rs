use tauri::Manager;
use reqwest::Client;
use crate::services::{ingest_engine, wiki_engine, chat_engine};

#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    let client = Client::new();
    match client.get("http://127.0.0.1:11434/api/tags").send().await {
        Ok(res) => Ok(res.status().is_success()),
        Err(e) => {
            println!("Ollama check failed: {}", e);
            Ok(false)
        }
    }
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
