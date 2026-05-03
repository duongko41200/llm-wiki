use std::path::PathBuf;
use rusqlite::{Connection, Result as SqlResult, params};
use crate::models::ErrorNote;

fn get_db_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

pub fn get_all_notes(app_dir: &PathBuf) -> Result<Vec<ErrorNote>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, category, title, description, source, repeat_count, is_resolved, position_x, position_y, created_at, updated_at FROM error_notes ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    
    let note_iter = stmt.query_map([], |row| {
        let is_resolved_int: i32 = row.get(6)?;
        Ok(ErrorNote {
            id: row.get(0)?,
            category: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            source: row.get(4)?,
            repeat_count: row.get(5)?,
            is_resolved: is_resolved_int > 0,
            position_x: row.get(7)?,
            position_y: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note.map_err(|e| e.to_string())?);
    }

    Ok(notes)
}

pub fn create_note(
    app_dir: &PathBuf,
    category: String,
    title: String,
    description: String,
    source: Option<String>,
) -> Result<ErrorNote, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO error_notes (category, title, description, source, position_x, position_y) VALUES (?1, ?2, ?3, ?4, 0, 0)",
        params![category, title, description, source],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // Fetch the newly created note
    let mut stmt = conn.prepare("SELECT id, category, title, description, source, repeat_count, is_resolved, position_x, position_y, created_at, updated_at FROM error_notes WHERE id = ?1").map_err(|e| e.to_string())?;
    
    let mut note_iter = stmt.query_map(params![id], |row| {
        let is_resolved_int: i32 = row.get(6)?;
        Ok(ErrorNote {
            id: row.get(0)?,
            category: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            source: row.get(4)?,
            repeat_count: row.get(5)?,
            is_resolved: is_resolved_int > 0,
            position_x: row.get(7)?,
            position_y: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    if let Some(note) = note_iter.next() {
        return note.map_err(|e| e.to_string());
    }

    Err("Failed to fetch created note".to_string())
}

pub fn update_note_position(app_dir: &PathBuf, id: i64, x: f64, y: f64) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE error_notes SET position_x = ?1, position_y = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![x, y, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn toggle_note_resolved(app_dir: &PathBuf, id: i64, is_resolved: bool) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let resolved_int = if is_resolved { 1 } else { 0 };

    conn.execute(
        "UPDATE error_notes SET is_resolved = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![resolved_int, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn increment_note_repeat(app_dir: &PathBuf, id: i64) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE error_notes SET repeat_count = repeat_count + 1, updated_at = datetime('now') WHERE id = ?1",
        params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn delete_note(app_dir: &PathBuf, id: i64) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM error_notes WHERE id = ?1",
        params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
