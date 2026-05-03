// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;

use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    original_filename TEXT NOT NULL,
                    raw_path TEXT NOT NULL,
                    wiki_source_path TEXT,
                    file_type TEXT NOT NULL,
                    file_size_bytes INTEGER,
                    status TEXT NOT NULL DEFAULT 'pending',
                    error_message TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_id TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding BLOB,
                    word_count INTEGER,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
                
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_v2_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS error_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    source TEXT,
                    repeat_count INTEGER DEFAULT 1,
                    is_resolved INTEGER DEFAULT 0,
                    position_x REAL DEFAULT 0,
                    position_y REAL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS study_schedule (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scheduled_date TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    task_title TEXT NOT NULL,
                    task_description TEXT,
                    duration_minutes INTEGER DEFAULT 15,
                    is_completed INTEGER DEFAULT 0,
                    completed_at TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS skill_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_type TEXT NOT NULL,
                    score_task REAL,
                    score_grammar REAL,
                    score_vocabulary REAL,
                    score_coherence REAL,
                    score_pronunciation REAL,
                    total_score REAL,
                    feedback TEXT,
                    user_input TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_voice_journal",
            sql: "
                CREATE TABLE IF NOT EXISTS voice_journal (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    transcript TEXT NOT NULL,
                    sentiment TEXT,
                    feedback TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(SqlBuilder::default().add_migrations("sqlite:knowledge_forge.db", migrations).build())
        .invoke_handler(tauri::generate_handler![
            commands::check_ollama,
            commands::check_ollama_installed,
            commands::start_ollama_serve,
            commands::install_ollama,
            commands::pull_ollama_model,
            commands::get_settings,
            commands::ingest_document,
            commands::ingest_url,
            commands::send_chat_message,
            commands::generate_quiz,
            commands::get_document_chunks,
            commands::delete_document,
            commands::get_error_notes,
            commands::create_error_note,
            commands::update_note_position,
            commands::toggle_note_resolved,
            commands::increment_note_repeat,
            commands::delete_error_note,
            commands::generate_study_schedule,
            commands::get_today_schedule,
            commands::complete_study_task,
            commands::get_schedule_stats,
            commands::grade_writing,
            commands::generate_speaking_question,
            commands::grade_speaking,
            commands::summarize_document,
            commands::explain_in_context,
            commands::generate_reading_quiz,
            commands::grade_shadowing,
            commands::save_journal_entry,
            commands::get_journal_entries
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
