use std::path::Path;
use std::io::Read;
use crate::models::IngestResult;
use super::ollama_client;
use super::wiki_engine;

/// Read a file and return its text content, handling different formats.
fn read_file_as_text(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "docx" => extract_text_from_docx(file_path),
        "pdf"  => read_pdf_as_text(file_path),
        _      => {
            // Plain text, markdown, txt
            std::fs::read_to_string(file_path)
                .map_err(|e| format!("Failed to read file {}: {}", file_path, e))
        }
    }
}

/// Extract plain text from a .docx file (ZIP containing word/document.xml)
fn extract_text_from_docx(file_path: &str) -> Result<String, String> {
    let file = std::fs::File::open(file_path)
        .map_err(|e| format!("Cannot open DOCX file: {}", e))?;

    let mut zip = zip::ZipArchive::new(file)
        .map_err(|e| format!("Cannot parse DOCX as ZIP: {}", e))?;

    // DOCX stores content in word/document.xml
    let mut xml_file = zip.by_name("word/document.xml")
        .map_err(|_| "word/document.xml not found in DOCX".to_string())?;

    let mut xml_content = String::new();
    xml_file.read_to_string(&mut xml_content)
        .map_err(|e| format!("Failed to read document.xml: {}", e))?;

    // Strip XML tags to get plain text
    let text = strip_xml_tags(&xml_content);
    Ok(text)
}

/// Remove XML tags, keeping only text nodes
fn strip_xml_tags(xml: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut last_was_space = false;

    for ch in xml.chars() {
        match ch {
            '<' => { in_tag = true; }
            '>' => {
                in_tag = false;
                // Add a space between blocks
                if !last_was_space {
                    result.push(' ');
                    last_was_space = true;
                }
            }
            _ if !in_tag => {
                if ch == '\n' || ch == '\r' {
                    if !last_was_space {
                        result.push('\n');
                        last_was_space = true;
                    }
                } else {
                    result.push(ch);
                    last_was_space = ch == ' ';
                }
            }
            _ => {}
        }
    }

    // Collapse multiple spaces/newlines
    result.split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
}

/// For PDFs, we try to read as UTF-8, falling back to lossy conversion.
fn read_pdf_as_text(file_path: &str) -> Result<String, String> {
    let bytes = std::fs::read(file_path)
        .map_err(|e| format!("Failed to read PDF file: {}", e))?;
    // PDF is binary — extract printable ASCII as a best-effort fallback.
    // In production this would use a proper PDF parsing crate.
    let text: String = bytes.iter()
        .filter(|&&b| b >= 32 && b < 127 || b == b'\n' || b == b'\r')
        .map(|&b| b as char)
        .collect();
    if text.trim().is_empty() {
        Err("Could not extract readable text from PDF. Please convert it to .md or .txt first.".to_string())
    } else {
        Ok(text)
    }
}

pub async fn run_ingest_pipeline(app_dir: &Path, document_id: &str, raw_path: &str) -> Result<IngestResult, String> {
    // 0. Ensure all wiki directories exist (create on first run)
    wiki_engine::ensure_wiki_dirs(app_dir)?;

    // 1. Read file content (handles DOCX, PDF, plain text)
    let raw_text = read_file_as_text(raw_path)?;

    if raw_text.trim().is_empty() {
        return Err("File appears to be empty or could not be read as text.".to_string());
    }

    // 2. Log start
    wiki_engine::append_to_log(app_dir, "ingest", &format!("Started ingestion for {}", raw_path))?;

    // 3. Send to Ollama
    let extracted = ollama_client::generate_knowledge(&raw_text).await?;

    // 4. Write wiki files
    let wiki_source_path = wiki_engine::write_source_summary(app_dir, raw_path, &extracted)?;

    for entity in &extracted.entities {
        let _ = wiki_engine::write_entity(app_dir, entity, raw_path);
    }

    for concept in &extracted.concepts {
        let _ = wiki_engine::write_concept(app_dir, concept, raw_path);
    }

    // 5. Update LOG
    wiki_engine::append_to_log(
        app_dir,
        "ingest",
        &format!(
            "Completed ingestion for {}. Extracted {} entities, {} concepts.",
            raw_path, extracted.entities.len(), extracted.concepts.len()
        )
    )?;

    Ok(IngestResult {
        document_id: document_id.to_string(),
        status: "ready".to_string(),
        wiki_source_path: Some(wiki_source_path),
        error_message: None,
    })
}
