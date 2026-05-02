use reqwest::Client;

/// Fetch plain text content from a URL by stripping HTML tags
pub async fn fetch_url_as_text(url: &str) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("Mozilla/5.0 (compatible; KnowledgeForge/1.0)")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL '{}': {}", url, e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP {} when fetching '{}'", res.status(), url));
    }

    let html = res.text().await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let text = strip_html(&html);

    if text.trim().len() < 50 {
        return Err("Không trích xuất được nội dung có nghĩa từ URL này.".to_string());
    }

    Ok(text)
}

/// Simple HTML tag stripper — no external dependency
fn strip_html(html: &str) -> String {
    let mut result = String::with_capacity(html.len() / 2);
    let mut in_tag = false;
    let mut in_script = false;
    let mut in_style = false;
    let mut last_was_space = false;
    let chars: Vec<char> = html.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];

        if ch == '<' {
            // Check for script/style tags to skip their content entirely
            let tag_start: String = chars[i..len.min(i + 8)].iter().collect();
            let tag_lower = tag_start.to_lowercase();
            if tag_lower.starts_with("<script") {
                in_script = true;
            } else if tag_lower.starts_with("</script") {
                in_script = false;
            } else if tag_lower.starts_with("<style") {
                in_style = true;
            } else if tag_lower.starts_with("</style") {
                in_style = false;
            }
            in_tag = true;
            i += 1;
            continue;
        }

        if ch == '>' {
            in_tag = false;
            // Add a space after block-level tags for readability
            if !last_was_space {
                result.push(' ');
                last_was_space = true;
            }
            i += 1;
            continue;
        }

        if in_tag || in_script || in_style {
            i += 1;
            continue;
        }

        // Handle HTML entities
        if ch == '&' {
            let rest: String = chars[i..len.min(i + 7)].iter().collect();
            if rest.starts_with("&amp;") { result.push('&'); i += 5; last_was_space = false; continue; }
            if rest.starts_with("&lt;")  { result.push('<'); i += 4; last_was_space = false; continue; }
            if rest.starts_with("&gt;")  { result.push('>'); i += 4; last_was_space = false; continue; }
            if rest.starts_with("&nbsp;") { result.push(' '); i += 6; last_was_space = true; continue; }
            if rest.starts_with("&quot;") { result.push('"'); i += 6; last_was_space = false; continue; }
        }

        if ch == '\n' || ch == '\r' || ch == '\t' {
            if !last_was_space {
                result.push('\n');
                last_was_space = true;
            }
        } else if ch == ' ' {
            if !last_was_space {
                result.push(' ');
                last_was_space = true;
            }
        } else {
            result.push(ch);
            last_was_space = false;
        }

        i += 1;
    }

    // Collapse excessive newlines
    let mut cleaned = String::new();
    let mut newline_count = 0;
    for ch in result.chars() {
        if ch == '\n' {
            newline_count += 1;
            if newline_count <= 2 {
                cleaned.push(ch);
            }
        } else {
            newline_count = 0;
            cleaned.push(ch);
        }
    }

    cleaned.trim().to_string()
}
