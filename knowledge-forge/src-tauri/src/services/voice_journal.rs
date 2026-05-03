use std::path::PathBuf;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

use crate::models::LlmConfig;
use crate::services::gemini_client;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VoiceJournalEntry {
    pub id: i64,
    pub date: String,
    pub transcript: String,
    pub sentiment: Option<String>,
    pub feedback: Option<String>,
    pub created_at: String,
}

fn get_db_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

pub async fn save_journal_entry(
    app_dir: &PathBuf,
    date: &str,
    transcript: &str,
    llm_config: LlmConfig,
) -> Result<VoiceJournalEntry, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an AI analyzing a voice journal entry.
Return a JSON object matching this schema:
{
  \"sentiment\": \"string (e.g. Positive, Negative, Neutral, Excited, Stressed)\",
  \"feedback\": \"string (A short, encouraging 2-sentence feedback evaluating their English fluency and giving a tip)\"
}";
    let user_prompt = format!("Journal Entry (Date: {}):\n\n{}", date, transcript);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    let gemini_response = gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await?;
    let cleaned_response = gemini_response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    
    let analysis: serde_json::Value = serde_json::from_str(cleaned_response)
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let sentiment = analysis["sentiment"].as_str().map(|s| s.to_string());
    let feedback = analysis["feedback"].as_str().map(|s| s.to_string());

    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO voice_journal (date, transcript, sentiment, feedback) VALUES (?1, ?2, ?3, ?4)",
        params![date, transcript, sentiment, feedback],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let entry = VoiceJournalEntry {
        id,
        date: date.to_string(),
        transcript: transcript.to_string(),
        sentiment,
        feedback,
        created_at: chrono::Local::now().to_string(),
    };

    Ok(entry)
}

pub fn get_journal_entries(app_dir: &PathBuf) -> Result<Vec<VoiceJournalEntry>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, date, transcript, sentiment, feedback, created_at FROM voice_journal ORDER BY date DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(VoiceJournalEntry {
            id: row.get(0)?,
            date: row.get(1)?,
            transcript: row.get(2)?,
            sentiment: row.get(3)?,
            feedback: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for row in rows {
        if let Ok(entry) = row {
            entries.push(entry);
        }
    }

    Ok(entries)
}
