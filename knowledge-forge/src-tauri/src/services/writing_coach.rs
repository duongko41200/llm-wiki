use std::path::PathBuf;
use rusqlite::{Connection, params};
use serde_json::json;

use crate::models::{LlmConfig, WritingResult, WritingErrorDetail};
use crate::services::{gemini_client, error_notes, vector_store};

fn get_db_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

pub async fn grade_writing(
    app_dir: &PathBuf,
    user_text: &str,
    prompt_topic: &str,
    llm_config: LlmConfig,
) -> Result<WritingResult, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    // 1. Find sample from docs if exists
    let sample_essay = find_sample_from_docs(app_dir, prompt_topic, &llm_config, &api_key).await.unwrap_or(None);

    // 2. Call Gemini to grade
    let system_instruction = "You are an expert English teacher grading an Aptis writing exam.
Evaluate the user's text based on the given topic. 
Score out of 5 for each criteria: task_response_score, grammar_score, vocabulary_score, coherence_score.
Calculate the overall_band (A1, A2, B1, B2, C).
Provide overall_feedback.
List specific errors in the text, their error_type (grammar, vocabulary, spelling, punctuation), original_text, corrected_text, and explanation.
Return the response STRICTLY as a JSON object matching this schema:
{
  \"task_response_score\": number,
  \"grammar_score\": number,
  \"vocabulary_score\": number,
  \"coherence_score\": number,
  \"overall_band\": \"string\",
  \"overall_feedback\": \"string\",
  \"errors\": [
    {
      \"error_type\": \"string\",
      \"original_text\": \"string\",
      \"corrected_text\": \"string\",
      \"explanation\": \"string\"
    }
  ]
}";

    let full_prompt = format!("{}\n\nTopic: {}\n\nUser Text:\n{}", system_instruction, prompt_topic, user_text);

    let gemini_response = gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await?;
    
    // Clean response (strip markdown json blocks if any)
    let cleaned_response = gemini_response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    
    let mut writing_result: WritingResult = match serde_json::from_str(cleaned_response) {
        Ok(res) => res,
        Err(e) => return Err(format!("Failed to parse Gemini response: {}", e)),
    };

    writing_result.sample_essay = sample_essay;

    // 3. Save to skill_results DB
    save_writing_result(app_dir, user_text, &writing_result)?;

    // 4. Auto create sticky notes for errors
    create_error_notes_from_writing(app_dir, &writing_result.errors)?;

    Ok(writing_result)
}

pub async fn find_sample_from_docs(app_dir: &PathBuf, topic: &str, _llm_config: &LlmConfig, api_key: &str) -> Result<Option<String>, String> {
    // Search vector store for the topic to see if we have relevant docs
    // First, embed the topic:
    let topic_embedding = gemini_client::embed_text(api_key, topic).await?;
    
    let chunks = vector_store::search_similar_chunks(app_dir, &topic_embedding, None, 2)?;
    
    if chunks.is_empty() {
        Ok(None)
    } else {
        let mut sample = String::from("Reference from your documents:\n\n");
        for chunk in chunks {
            sample.push_str(&chunk.chunk.content);
            sample.push_str("\n\n---\n\n");
        }
        Ok(Some(sample))
    }
}

pub fn save_writing_result(app_dir: &PathBuf, user_text: &str, result: &WritingResult) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let total_score = result.task_response_score + result.grammar_score + result.vocabulary_score + result.coherence_score;
    let feedback_json = json!(result).to_string();

    conn.execute(
        "INSERT INTO skill_results (skill_type, score_task, score_grammar, score_vocabulary, score_coherence, total_score, feedback, user_input)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            "writing",
            result.task_response_score,
            result.grammar_score,
            result.vocabulary_score,
            result.coherence_score,
            total_score,
            feedback_json,
            user_text
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn create_error_notes_from_writing(app_dir: &PathBuf, errors: &Vec<WritingErrorDetail>) -> Result<(), String> {
    for error in errors {
        let category = match error.error_type.to_lowercase().as_str() {
            "grammar" => "grammar",
            "vocabulary" => "vocabulary",
            "spelling" => "vocabulary", // Group spelling under vocab
            "punctuation" => "grammar",
            _ => "other",
        };

        let title = format!("Error: {}", error.original_text);
        let desc = format!("Correction: {}\nExplanation: {}", error.corrected_text, error.explanation);

        // create_note(app_dir: &PathBuf, category: String, title: String, description: String, source: Option<String>)
        error_notes::create_note(
            app_dir, 
            category.to_string(), 
            title, 
            desc, 
            Some("writing".to_string())
        )?;
    }
    
    Ok(())
}
