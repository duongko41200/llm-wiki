use std::path::PathBuf;
use rusqlite::{Connection, params};
use serde_json::json;

use crate::models::{LlmConfig, SpeakingResult, SpeakingQuestion, WritingErrorDetail};
use crate::services::{gemini_client, error_notes};

fn get_db_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

pub async fn generate_speaking_question(
    part_number: u8,
    llm_config: LlmConfig,
) -> Result<SpeakingQuestion, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an Aptis speaking examiner. Generate a set of questions for a specific part of the exam.
Return the response STRICTLY as a JSON object matching this schema:
{
  \"part\": number,
  \"scenario\": \"string\",
  \"questions\": [\"string\", \"string\", ...]
}";

    let user_prompt = match part_number {
        1 => "Generate 3 personal questions for Aptis Speaking Part 1 (e.g. family, hobbies, job).",
        2 => "Generate 1 scenario and 3 questions for Aptis Speaking Part 2 (Describe a picture/experience).",
        3 => "Generate 1 scenario and 3 questions for Aptis Speaking Part 3 (Compare two pictures/options).",
        4 => "Generate 1 scenario and 3 questions for Aptis Speaking Part 4 (Answer 3 questions about an abstract topic).",
        _ => "Generate 3 general English conversation questions.",
    };

    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);
    let gemini_response = gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await?;
    
    let cleaned_response = gemini_response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    
    let question: SpeakingQuestion = match serde_json::from_str(cleaned_response) {
        Ok(res) => res,
        Err(e) => return Err(format!("Failed to parse Gemini response: {}", e)),
    };

    Ok(question)
}

pub async fn grade_speaking(
    app_dir: &PathBuf,
    transcript: &str,
    question: &str,
    llm_config: LlmConfig,
) -> Result<SpeakingResult, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an expert English teacher grading an Aptis speaking exam based on a transcript.
Evaluate the user's spoken text based on the given question/scenario. 
Score out of 5 for each criteria: grammar_score, vocabulary_score, pronunciation_score (infer from spelling/context mistakes if possible), fluency_score (infer from sentence structure and flow).
Calculate the overall_band (A1, A2, B1, B2, C).
Provide overall_feedback.
List specific errors in the text, their error_type (grammar, vocabulary, pronunciation), original_text, corrected_text, and explanation.
Provide an improved_answer.
Return the response STRICTLY as a JSON object matching this schema:
{
  \"grammar_score\": number,
  \"vocabulary_score\": number,
  \"pronunciation_score\": number,
  \"fluency_score\": number,
  \"overall_band\": \"string\",
  \"overall_feedback\": \"string\",
  \"errors\": [
    {
      \"error_type\": \"string\",
      \"original_text\": \"string\",
      \"corrected_text\": \"string\",
      \"explanation\": \"string\"
    }
  ],
  \"improved_answer\": \"string\"
}";

    let user_prompt = format!("Question/Scenario: {}\n\nUser Transcript:\n{}", question, transcript);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    let gemini_response = gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await?;
    
    let cleaned_response = gemini_response.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    
    let speaking_result: SpeakingResult = match serde_json::from_str(cleaned_response) {
        Ok(res) => res,
        Err(e) => return Err(format!("Failed to parse Gemini response: {}", e)),
    };

    // Save to DB
    save_speaking_result(app_dir, transcript, &speaking_result)?;

    // Create error notes
    create_error_notes_from_speaking(app_dir, &speaking_result.errors)?;

    Ok(speaking_result)
}

pub fn save_speaking_result(app_dir: &PathBuf, transcript: &str, result: &SpeakingResult) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let total_score = result.grammar_score + result.vocabulary_score + result.pronunciation_score + result.fluency_score;
    let feedback_json = json!(result).to_string();

    conn.execute(
        "INSERT INTO skill_results (skill_type, score_grammar, score_vocabulary, score_pronunciation, score_coherence, total_score, feedback, user_input)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            "speaking",
            result.grammar_score,
            result.vocabulary_score,
            result.pronunciation_score,
            result.fluency_score, // Map fluency to coherence
            total_score,
            feedback_json,
            transcript
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn create_error_notes_from_speaking(app_dir: &PathBuf, errors: &Vec<WritingErrorDetail>) -> Result<(), String> {
    for error in errors {
        let category = match error.error_type.to_lowercase().as_str() {
            "grammar" => "grammar",
            "vocabulary" => "vocabulary",
            "pronunciation" => "pronunciation",
            _ => "other",
        };

        let title = format!("Speaking: {}", error.original_text);
        let desc = format!("Correction: {}\nExplanation: {}", error.corrected_text, error.explanation);

        error_notes::create_note(
            app_dir, 
            category.to_string(), 
            title, 
            desc, 
            Some("speaking".to_string())
        )?;
    }
    
    Ok(())
}

pub async fn grade_shadowing(
    transcript: &str,
    original_text: &str,
    llm_config: LlmConfig,
) -> Result<String, String> {
    let api_key = match &llm_config.api_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => return Err("Gemini API key is not configured.".into()),
    };

    let system_instruction = "You are an English pronunciation coach. The user is practicing Audio Shadowing. 
Compare the user's transcript with the original text.
Point out any missing words, wrong words, or pronunciation mistakes based on the transcription differences.
Provide a short, constructive feedback message in Vietnamese, and an accuracy percentage (e.g. 85%).
Return ONLY a JSON object: {\"accuracy\": number, \"feedback\": \"string\"}";

    let user_prompt = format!("Original Text: {}\nUser Transcript: {}", original_text, transcript);
    let full_prompt = format!("{}\n\n{}", system_instruction, user_prompt);

    gemini_client::generate_single(&api_key, &llm_config.model, &full_prompt).await
}
