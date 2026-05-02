use std::path::Path;
use std::io::Read;
use crate::models::IngestResult;
use super::ollama_client;
use super::vector_store;

const CHUNK_MAX_WORDS: usize = 500;
const CHUNK_OVERLAP_WORDS: usize = 50;

// ─── Public helpers ──────────────────────────────────────────────────────────

/// Read a file and return its text content (PDF, DOCX, or plain text).
pub fn read_file_as_text(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "docx" => extract_text_from_docx(file_path),
        "pdf"  => read_pdf_as_text(file_path),
        _      => std::fs::read_to_string(file_path)
                    .map_err(|e| format!("Failed to read file {}: {}", file_path, e)),
    }
}

// ─── Private helpers ─────────────────────────────────────────────────────────

fn extract_text_from_docx(file_path: &str) -> Result<String, String> {
    let file = std::fs::File::open(file_path)
        .map_err(|e| format!("Cannot open DOCX file: {}", e))?;
    let mut zip = zip::ZipArchive::new(file)
        .map_err(|e| format!("Cannot parse DOCX as ZIP: {}", e))?;
    let mut xml_file = zip.by_name("word/document.xml")
        .map_err(|_| "word/document.xml not found in DOCX".to_string())?;
    let mut xml_content = String::new();
    xml_file.read_to_string(&mut xml_content)
        .map_err(|e| format!("Failed to read document.xml: {}", e))?;
    Ok(strip_xml_tags(&xml_content))
}

fn strip_xml_tags(xml: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut last_was_space = false;
    for ch in xml.chars() {
        match ch {
            '<' => { in_tag = true; }
            '>' => {
                in_tag = false;
                if !last_was_space { result.push(' '); last_was_space = true; }
            }
            _ if !in_tag => {
                if ch == '\n' || ch == '\r' {
                    if !last_was_space { result.push('\n'); last_was_space = true; }
                } else {
                    result.push(ch);
                    last_was_space = ch == ' ';
                }
            }
            _ => {}
        }
    }
    result.split_whitespace().collect::<Vec<&str>>().join(" ")
}

fn read_pdf_as_text(file_path: &str) -> Result<String, String> {
    let bytes = std::fs::read(file_path)
        .map_err(|e| format!("Failed to read PDF file: {}", e))?;
    // Very rudimentary extraction. Should use proper PDF extraction.
    let text: String = bytes.iter()
        .filter(|&&b| b >= 32 && b < 127 || b == b'\n' || b == b'\r')
        .map(|&b| b as char)
        .collect();
    if text.trim().is_empty() || text.len() < 50 {
        Err("Could not extract text from PDF (binary format). Please install the Python sidecar parser, or convert to .txt/.md first.".to_string())
    } else {
        Ok(text)
    }
}

// ─── Main pipeline ───────────────────────────────────────────────────────────

pub async fn run_rag_ingest(
    app_dir: &Path,
    document_id: &str,
    raw_path: &str,
    window: &tauri::Window,
) -> Result<IngestResult, String> {

    // 1. Read file
    let raw_text = read_file_as_text(raw_path)?;
    if raw_text.trim().is_empty() {
        return Err("File rỗng hoặc không đọc được nội dung.".to_string());
    }

    // 2. Split into chunks
    let chunks = vector_store::split_into_chunks(&raw_text, CHUNK_MAX_WORDS, CHUNK_OVERLAP_WORDS);
    if chunks.is_empty() {
        return Err("Không tạo được chunks nào từ file.".to_string());
    }
    
    let total_chunks = chunks.len();

    // 3. Ensure Embed Model exists
    ollama_client::ensure_embed_model(window).await?;

    // 4. Batch Embedding
    // Group chunks into texts
    let chunk_texts: Vec<String> = chunks.iter().map(|c| c.content.clone()).collect();
    
    let embeddings = ollama_client::embed_texts(chunk_texts).await?;
    
    if embeddings.len() != chunks.len() {
        return Err(format!("Lỗi nhúng: Trả về {} vectors cho {} chunks", embeddings.len(), chunks.len()));
    }

    // 5. Store in SQLite DB
    vector_store::insert_chunks(app_dir, document_id, &chunks, &embeddings)?;

    Ok(IngestResult {
        document_id: document_id.to_string(),
        status: "ready".to_string(),
        chunks_count: total_chunks,
        error_message: None,
    })
}
