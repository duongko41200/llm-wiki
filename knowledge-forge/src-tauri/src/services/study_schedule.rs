use std::path::PathBuf;
use rusqlite::{Connection, params};
use chrono::Local;
use crate::models::{StudyTask, ScheduleStats, LlmConfig};

fn get_db_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join("knowledge_forge.db")
}

fn get_today_str() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

pub async fn generate_daily_schedule(app_dir: &PathBuf, _llm_config: LlmConfig) -> Result<Vec<StudyTask>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let today = get_today_str();

    // Check if we already have tasks for today
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM study_schedule WHERE scheduled_date = ?1",
        params![today],
        |row| row.get(0)
    ).unwrap_or(0);

    if count > 0 {
        return get_today_schedule(app_dir);
    }

    // Hardcode a dynamic schedule generation based on some logic (or just simple fallback)
    // For now, generate a fixed daily template if none exists.
    // In the future, this can call the LLM to analyze error notes and create specific tasks.

    let tasks_to_insert = vec![
        ("speaking", "Luyện Speaking Part 2", "1 phút chuẩn bị, 2 phút nói về một chủ đề quen thuộc.", 15),
        ("review_notes", "Ôn tập ghi chú lỗi", "Xem lại các lỗi chưa sửa trên bảng Sticky Notes.", 5),
        ("reading", "Luyện đọc nhanh", "Đọc một đoạn văn 300 từ trong 2 phút.", 10),
    ];

    for (t_type, title, desc, duration) in tasks_to_insert {
        conn.execute(
            "INSERT INTO study_schedule (scheduled_date, task_type, task_title, task_description, duration_minutes) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![today, t_type, title, desc, duration],
        ).map_err(|e| e.to_string())?;
    }

    get_today_schedule(app_dir)
}

pub fn get_today_schedule(app_dir: &PathBuf) -> Result<Vec<StudyTask>, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let today = get_today_str();

    let mut stmt = conn.prepare(
        "SELECT id, scheduled_date, task_type, task_title, task_description, duration_minutes, is_completed, completed_at, created_at FROM study_schedule WHERE scheduled_date = ?1 ORDER BY id ASC"
    ).map_err(|e| e.to_string())?;

    let iter = stmt.query_map(params![today], |row| {
        let is_completed_int: i32 = row.get(6)?;
        Ok(StudyTask {
            id: row.get(0)?,
            scheduled_date: row.get(1)?,
            task_type: row.get(2)?,
            task_title: row.get(3)?,
            task_description: row.get(4)?,
            duration_minutes: row.get(5)?,
            is_completed: is_completed_int > 0,
            completed_at: row.get(7)?,
            created_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in iter {
        tasks.push(task.map_err(|e| e.to_string())?);
    }

    Ok(tasks)
}

pub fn complete_task(app_dir: &PathBuf, id: i64) -> Result<(), String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE study_schedule SET is_completed = 1, completed_at = datetime('now') WHERE id = ?1",
        params![id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_schedule_stats(app_dir: &PathBuf) -> Result<ScheduleStats, String> {
    let db_path = get_db_path(app_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let today = get_today_str();

    // Get today's stats
    let today_total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM study_schedule WHERE scheduled_date = ?1",
        params![today],
        |row| row.get(0)
    ).unwrap_or(0);

    let today_completed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM study_schedule WHERE scheduled_date = ?1 AND is_completed = 1",
        params![today],
        |row| row.get(0)
    ).unwrap_or(0);

    // Calculate mock streak
    // Here we just return a simple hardcoded streak or calculate from DB
    // Simple logic: if today is completed, streak = 1
    let mut streak = 0;
    if today_total > 0 && today_total == today_completed {
        streak = 1;
    }

    Ok(ScheduleStats {
        current_streak: streak,
        today_completed: today_completed as usize,
        today_total: today_total as usize,
    })
}
