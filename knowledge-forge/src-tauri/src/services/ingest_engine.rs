use std::path::Path;
use crate::models::IngestResult;
use super::ollama_client;
use super::wiki_engine;

pub async fn run_ingest_pipeline(app_dir: &Path, document_id: &str, raw_path: &str) -> Result<IngestResult, String> {
    // 1. Read raw markdown
    let full_raw_path = app_dir.join(raw_path);
    let raw_markdown = std::fs::read_to_string(&full_raw_path)
        .map_err(|e| format!("Failed to read raw markdown from {}: {}", raw_path, e))?;

    // 2. Log start
    wiki_engine::append_to_log(app_dir, "ingest", &format!("Started ingestion for {}", raw_path))?;

    // 3. Send prompt to Ollama
    let extracted = ollama_client::generate_knowledge(&raw_markdown).await?;

    // 4. Create wiki files
    let wiki_source_path = wiki_engine::write_source_summary(app_dir, raw_path, &extracted)?;

    for entity in &extracted.entities {
        let _ = wiki_engine::write_entity(app_dir, entity, raw_path);
    }

    for concept in &extracted.concepts {
        let _ = wiki_engine::write_concept(app_dir, concept, raw_path);
    }

    // 5. Update LOG.md
    wiki_engine::append_to_log(
        app_dir, 
        "ingest", 
        &format!("Completed ingestion for {}. Extracted {} entities, {} concepts.", raw_path, extracted.entities.len(), extracted.concepts.len())
    )?;

    // Return success
    Ok(IngestResult {
        document_id: document_id.to_string(),
        status: "ready".to_string(),
        wiki_source_path: Some(wiki_source_path),
        error_message: None,
    })
}
