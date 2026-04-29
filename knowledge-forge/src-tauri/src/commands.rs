use reqwest::Client;

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
