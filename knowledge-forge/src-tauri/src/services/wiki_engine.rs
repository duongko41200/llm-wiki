use std::fs;
use std::path::Path;
use std::io::Write;
use chrono::Local;

fn sanitize_filename(name: &str) -> String {
    name.to_lowercase()
        .replace(' ', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-')
        .collect()
}

pub fn ensure_wiki_dirs(app_dir: &Path) -> Result<(), String> {
    let wiki_dir = app_dir.join("wiki");
    fs::create_dir_all(wiki_dir.join("sources")).map_err(|e| e.to_string())?;
    fs::create_dir_all(wiki_dir.join("entities")).map_err(|e| e.to_string())?;
    fs::create_dir_all(wiki_dir.join("concepts")).map_err(|e| e.to_string())?;
    fs::create_dir_all(wiki_dir.join("syntheses")).map_err(|e| e.to_string())?;
    
    // Create INDEX.md if not exists
    let index_path = wiki_dir.join("INDEX.md");
    if !index_path.exists() {
        fs::write(&index_path, "# LLM-Wiki Index\n\n## Sources\n\n## Entities\n\n## Concepts\n").map_err(|e| e.to_string())?;
    }
    
    // Create LOG.md if not exists
    let log_path = wiki_dir.join("LOG.md");
    if !log_path.exists() {
        fs::write(&log_path, "# System Log\n").map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

pub fn append_to_log(app_dir: &Path, action: &str, description: &str) -> Result<(), String> {
    let log_path = app_dir.join("wiki").join("LOG.md");
    let now = Local::now().format("%Y-%m-%d %H:%M").to_string();
    let log_entry = format!("\n## [{}] {} | {}\n", now, action, description);
    
    let mut file = fs::OpenOptions::new().append(true).open(&log_path).map_err(|e| e.to_string())?;
    file.write_all(log_entry.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn append_to_index(app_dir: &Path, category: &str, title: &str, link: &str, description: &str) -> Result<(), String> {
    let index_path = app_dir.join("wiki").join("INDEX.md");
    let content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
    
    let section_header = format!("## {}", category);
    let new_entry = format!("- [{}]({}) - {}\n", title, link, description.replace('\n', " "));
    
    // Simple way to append under the correct section
    let mut new_content = String::new();
    let mut in_section = false;
    let inserted = false;
    
    for line in content.lines() {
        new_content.push_str(line);
        new_content.push('\n');
        
        if line.starts_with(&section_header) {
            in_section = true;
        } else if in_section && line.starts_with("## ") {
            // Reached next section, insert here if we haven't
            if !inserted {
                // Insert before the new section
                // Actually, the logic above already added the line. Let's rebuild the logic.
            }
        }
    }
    
    // A simpler replacement approach:
    let replacement = format!("{}\n{}", section_header, new_entry);
    let updated_content = content.replace(&section_header, &replacement);
    
    fs::write(&index_path, updated_content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_index(app_dir: &Path) -> Result<String, String> {
    let index_path = app_dir.join("wiki").join("INDEX.md");
    if index_path.exists() {
        fs::read_to_string(index_path).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

pub fn write_source_summary(app_dir: &Path, raw_path: &str, extracted: &crate::models::ExtractedKnowledge) -> Result<String, String> {
    ensure_wiki_dirs(app_dir)?;
    
    let source_name = Path::new(raw_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown-source");
        
    let safe_name = sanitize_filename(source_name);
    let file_name = format!("{}.md", safe_name);
    let file_path = app_dir.join("wiki").join("sources").join(&file_name);
    let today = Local::now().format("%Y-%m-%d").to_string();
    
    let mut entities_links = String::new();
    for entity in &extracted.entities {
        entities_links.push_str(&format!("- [[{}]]\n", sanitize_filename(&entity.name)));
    }
    
    let mut concepts_links = String::new();
    for concept in &extracted.concepts {
        concepts_links.push_str(&format!("- [[{}]]\n", sanitize_filename(&concept.name)));
    }
    
    let mut key_takeaways = String::new();
    for tk in &extracted.key_takeaways {
        key_takeaways.push_str(&format!("- {}\n", tk));
    }

    let content = format!(
r#"---
type: source
raw_path: {}
ingested: {}
---

# {}

## Tóm tắt
{}

## Key takeaways
{}
## Entities được nhắc đến
{}
## Concepts được nhắc đến
{}
"#, 
        raw_path, today, source_name, extracted.summary, key_takeaways, entities_links, concepts_links
    );
    
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    let rel_path = format!("sources/{}", file_name);
    append_to_index(app_dir, "Sources", source_name, &rel_path, &extracted.summary)?;
    
    Ok(rel_path)
}

pub fn write_entity(app_dir: &Path, entity: &crate::models::Entity, source_path: &str) -> Result<(), String> {
    let safe_name = sanitize_filename(&entity.name);
    let file_name = format!("{}.md", safe_name);
    let file_path = app_dir.join("wiki").join("entities").join(&file_name);
    let today = Local::now().format("%Y-%m-%d").to_string();
    
    if file_path.exists() {
        // Just append source if it exists. In a real app we would parse and merge properly.
        let mut content = fs::read_to_string(&file_path).unwrap_or_default();
        let source_link = format!("- [Source](../raw/{})\n", source_path);
        if !content.contains(&source_link) {
            content.push_str(&source_link);
            let _ = fs::write(&file_path, content);
        }
        return Ok(());
    }
    
    let content = format!(
r#"---
type: entity
category: {}
created: {}
updated: {}
---

# {}

{}

## Nguồn
- [Source](../raw/{})
"#,
        entity.r#type, today, today, entity.name, entity.description, source_path
    );
    
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    let rel_path = format!("entities/{}", file_name);
    append_to_index(app_dir, "Entities", &entity.name, &rel_path, &entity.description)?;
    
    Ok(())
}

pub fn write_concept(app_dir: &Path, concept: &crate::models::Concept, source_path: &str) -> Result<(), String> {
    let safe_name = sanitize_filename(&concept.name);
    let file_name = format!("{}.md", safe_name);
    let file_path = app_dir.join("wiki").join("concepts").join(&file_name);
    let today = Local::now().format("%Y-%m-%d").to_string();
    
    if file_path.exists() {
        let mut content = fs::read_to_string(&file_path).unwrap_or_default();
        let source_link = format!("- [Source](../raw/{})\n", source_path);
        if !content.contains(&source_link) {
            content.push_str(&source_link);
            let _ = fs::write(&file_path, content);
        }
        return Ok(());
    }
    
    let content = format!(
r#"---
type: concept
domain: {}
created: {}
updated: {}
---

# {}

## Định nghĩa
{}

## Nguồn
- [Source](../raw/{})
"#,
        concept.domain, today, today, concept.name, concept.definition, source_path
    );
    
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    let rel_path = format!("concepts/{}", file_name);
    append_to_index(app_dir, "Concepts", &concept.name, &rel_path, &concept.definition)?;
    
    Ok(())
}

pub fn search_wiki(app_dir: &Path, query: &str) -> Result<String, String> {
    let index_content = read_index(app_dir)?;
    
    let query_lower = query.to_lowercase();
    let mut extra_context = String::new();
    
    let safe_query = sanitize_filename(&query_lower);
    let concept_path = app_dir.join("wiki").join("concepts").join(format!("{}.md", safe_query));
    if concept_path.exists() {
        if let Ok(content) = fs::read_to_string(concept_path) {
            extra_context.push_str("\n\n--- Trích xuất Concept ---\n");
            extra_context.push_str(&content);
        }
    }
    
    let entity_path = app_dir.join("wiki").join("entities").join(format!("{}.md", safe_query));
    if entity_path.exists() {
        if let Ok(content) = fs::read_to_string(entity_path) {
            extra_context.push_str("\n\n--- Trích xuất Entity ---\n");
            extra_context.push_str(&content);
        }
    }
    
    Ok(format!("{}\n{}", index_content, extra_context))
}

pub fn get_source_content(app_dir: &Path, source_name: &str) -> Result<String, String> {
    let source_path = app_dir.join(source_name);
    
    if source_path.exists() {
        fs::read_to_string(source_path).map_err(|e| e.to_string())
    } else {
        let raw_path = app_dir.join("raw").join(source_name);
        if raw_path.exists() {
            fs::read_to_string(raw_path).map_err(|e| e.to_string())
        } else {
            Err(format!("Source {} not found", source_name))
        }
    }
}
