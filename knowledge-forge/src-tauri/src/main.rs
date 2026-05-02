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
            commands::send_chat_message,
            commands::generate_quiz,
            commands::get_document_chunks,
            commands::delete_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
