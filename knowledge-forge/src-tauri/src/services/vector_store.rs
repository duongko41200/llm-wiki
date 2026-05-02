use std::path::{Path, PathBuf};
use rusqlite::{Connection, params};
use crate::models::{ChunkData, ChunkRecord, ScoredChunk};

/// Get the path to the sqlite database managed by tauri-plugin-sql
fn get_db_path(app_dir: &Path) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

/// Calculate cosine similarity between two vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    
    let mut dot_product = 0.0;
    let mut norm_a = 0.0;
    let mut norm_b = 0.0;
    
    for i in 0..a.len() {
        dot_product += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    dot_product / (norm_a.sqrt() * norm_b.sqrt())
}

/// Convert Vec<f32> to bytes for BLOB storage
fn f32_vec_to_bytes(vec: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(vec.len() * 4);
    for &f in vec {
        bytes.extend_from_slice(&f.to_le_bytes());
    }
    bytes
}

/// Convert bytes from BLOB storage back to Vec<f32>
fn bytes_to_f32_vec(bytes: &[u8]) -> Vec<f32> {
    if bytes.len() % 4 != 0 {
        return Vec::new();
    }
    let mut vec = Vec::with_capacity(bytes.len() / 4);
    for chunk in bytes.chunks_exact(4) {
        let arr = [chunk[0], chunk[1], chunk[2], chunk[3]];
        vec.push(f32::from_le_bytes(arr));
    }
    vec
}

/// Split text into overlapping chunks based on word count
pub fn split_into_chunks(text: &str, max_words: usize, overlap_words: usize) -> Vec<ChunkData> {
    let words: Vec<&str> = text.split_whitespace().collect();
    let mut chunks = Vec::new();
    let mut current_idx = 0;
    let mut chunk_index = 0;
    
    if words.is_empty() {
        return chunks;
    }
    
    while current_idx < words.len() {
        let end_idx = std::cmp::min(current_idx + max_words, words.len());
        let chunk_words = &words[current_idx..end_idx];
        let content = chunk_words.join(" ");
        let word_count = chunk_words.len();
        
        chunks.push(ChunkData {
            chunk_index,
            content,
            word_count,
        });
        
        chunk_index += 1;
        
        if end_idx == words.len() {
            break;
        }
        
        current_idx = end_idx - overlap_words;
    }
    
    chunks
}

/// Insert chunks and their embeddings into the database
pub fn insert_chunks(app_dir: &Path, document_id: &str, chunks: &[ChunkData], embeddings: &[Vec<f32>]) -> Result<(), String> {
    if chunks.len() != embeddings.len() {
        return Err("Number of chunks and embeddings must match".to_string());
    }
    
    let db_path = get_db_path(app_dir);
    let mut conn = Connection::open(&db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    
    let tx = conn.transaction().map_err(|e| format!("Failed to start tx: {}", e))?;
    
    {
        let mut stmt = tx.prepare(
            "INSERT INTO chunks (document_id, chunk_index, content, embedding, word_count)
             VALUES (?1, ?2, ?3, ?4, ?5)"
        ).map_err(|e| format!("Failed to prepare stmt: {}", e))?;
        
        for (i, chunk) in chunks.iter().enumerate() {
            let emb_bytes = f32_vec_to_bytes(&embeddings[i]);
            stmt.execute(params![
                document_id,
                chunk.chunk_index as i64,
                chunk.content,
                emb_bytes,
                chunk.word_count as i64
            ]).map_err(|e| format!("Failed to insert chunk: {}", e))?;
        }
    }
    
    tx.commit().map_err(|e| format!("Failed to commit tx: {}", e))?;
    
    Ok(())
}

/// Search for similar chunks across all documents or specific documents
pub fn search_similar_chunks(
    app_dir: &Path, 
    query_embedding: &[f32], 
    document_ids: Option<Vec<String>>, 
    top_k: usize
) -> Result<Vec<ScoredChunk>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    
    let query = if let Some(ref ids) = document_ids {
        if ids.is_empty() {
            // Fallback to all if empty list provided
            "SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding, c.word_count, d.title 
             FROM chunks c JOIN documents d ON c.document_id = d.id".to_string()
        } else {
            let placeholders: Vec<String> = (1..=ids.len()).map(|i| format!("?{}", i)).collect();
            format!(
                "SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding, c.word_count, d.title 
                 FROM chunks c JOIN documents d ON c.document_id = d.id 
                 WHERE c.document_id IN ({})",
                placeholders.join(", ")
            )
        }
    } else {
        "SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding, c.word_count, d.title 
         FROM chunks c JOIN documents d ON c.document_id = d.id".to_string()
    };
    
    let mut stmt = conn.prepare(&query).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let mut rows = if let Some(ref ids) = document_ids {
        if ids.is_empty() {
            stmt.query([]).map_err(|e| e.to_string())?
        } else {
            let params_vec: Vec<&dyn rusqlite::ToSql> = ids.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
            stmt.query(rusqlite::params_from_iter(params_vec)).map_err(|e| e.to_string())?
        }
    } else {
        stmt.query([]).map_err(|e| e.to_string())?
    };
    
    let mut scored_chunks = Vec::new();
    
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: i64 = row.get(0).unwrap_or(0);
        let doc_id: String = row.get(1).unwrap_or_default();
        let chunk_idx: i64 = row.get(2).unwrap_or(0);
        let content: String = row.get(3).unwrap_or_default();
        let emb_bytes: Vec<u8> = row.get(4).unwrap_or_default();
        let word_count: i64 = row.get(5).unwrap_or(0);
        let title: String = row.get(6).unwrap_or_default();
        
        let chunk_emb = bytes_to_f32_vec(&emb_bytes);
        
        let score = if !chunk_emb.is_empty() {
            cosine_similarity(query_embedding, &chunk_emb)
        } else {
            0.0
        };
        
        // Skip irrelevant chunks early (threshold: 0.3 = weak relevance)
        if score < 0.30 { continue; }
        
        scored_chunks.push(ScoredChunk {
            chunk: ChunkRecord {
                id,
                document_id: doc_id,
                chunk_index: chunk_idx,
                content,
                embedding: None, // Don't return embedding to save memory
                word_count,
            },
            score,
            document_title: title,
        });
    }
    
    // Sort by score descending
    scored_chunks.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    
    // Take top K
    scored_chunks.truncate(top_k);
    
    Ok(scored_chunks)
}

/// Get all chunks for a specific document, without embeddings (to save memory)
pub fn get_document_chunks(app_dir: &Path, document_id: &str) -> Result<Vec<ChunkRecord>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, document_id, chunk_index, content, word_count 
         FROM chunks WHERE document_id = ?1 ORDER BY chunk_index ASC"
    ).map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![document_id]).map_err(|e| e.to_string())?;
    let mut chunks = Vec::new();
    
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        chunks.push(ChunkRecord {
            id: row.get(0).unwrap_or(0),
            document_id: row.get(1).unwrap_or_default(),
            chunk_index: row.get(2).unwrap_or(0),
            content: row.get(3).unwrap_or_default(),
            embedding: None,
            word_count: row.get(4).unwrap_or(0),
        });
    }
    
    Ok(chunks)
}

/// Delete a document and its chunks
pub fn delete_document_from_db(app_dir: &Path, document_id: &str) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let mut conn = Connection::open(&db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    
    let tx = conn.transaction().map_err(|e| format!("Failed to start tx: {}", e))?;
    
    // chunks will be deleted automatically due to ON DELETE CASCADE if configured correctly,
    // but we can explicitly delete them just in case PRAGMA foreign_keys is off.
    tx.execute("DELETE FROM chunks WHERE document_id = ?1", params![document_id])
      .map_err(|e| format!("Failed to delete chunks: {}", e))?;
      
    tx.execute("DELETE FROM documents WHERE id = ?1", params![document_id])
      .map_err(|e| format!("Failed to delete document: {}", e))?;
      
    tx.commit().map_err(|e| format!("Failed to commit tx: {}", e))?;
    Ok(())
}
