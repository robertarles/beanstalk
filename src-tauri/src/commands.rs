// Tauri commands for bean CRUD operations (beanstalk-v5m3)

use std::path::Path;

use crate::beans::{parse_bean_file, parse_beans_config, scan_beans_directory, build_tree, Bean};

// ── Read commands (beanstalk-h9hz) ──────────────────────────────────────────

#[tauri::command]
pub fn get_beans(project_path: String) -> Result<Vec<Bean>, String> {
    let path = Path::new(&project_path);
    let flat = scan_beans_directory(path).map_err(|e| e.to_string())?;
    Ok(build_tree(flat))
}

#[tauri::command]
pub fn get_bean(project_path: String, bean_id: String) -> Result<Bean, String> {
    let path = Path::new(&project_path);
    let flat = scan_beans_directory(path).map_err(|e| e.to_string())?;
    flat.into_iter()
        .find(|b| b.id == bean_id)
        .ok_or_else(|| format!("Bean not found: {}", bean_id))
}

// ── Create command (beanstalk-o6fz) ─────────────────────────────────────────

/// Convert a title to a filename-safe slug.
///
/// Lowercases the string, replaces every non-alphanumeric character with `-`,
/// collapses consecutive dashes, and trims leading/trailing dashes.
///
/// "FEAT: add a file browser" → "feat-add-a-file-browser"
fn title_to_slug(title: &str) -> String {
    let mut slug: String = title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();
    // Collapse consecutive dashes.
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }
    let slug = slug.trim_matches('-');
    if slug.is_empty() { "bean".to_string() } else { slug.to_string() }
}

/// Generate a short random ID suffix using timestamp nanoseconds encoded in
/// base-36. We take the last 4 characters to keep IDs short.
fn random_suffix() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0) as u64;
    // Mix with the low bits of full epoch millis for extra uniqueness.
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let n = (nanos ^ (millis.wrapping_mul(6364136223846793005))) & 0x00ff_ffff;
    // Encode as base-36, pad / trim to exactly 4 chars.
    base36_encode_u64(n % (36u64.pow(4)))
}

fn base36_encode_u64(mut n: u64) -> String {
    const CHARS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    if n == 0 {
        return "0000".to_string();
    }
    let mut digits = Vec::new();
    while n > 0 {
        digits.push(CHARS[(n % 36) as usize] as char);
        n /= 36;
    }
    // Pad to 4 and reverse.
    while digits.len() < 4 {
        digits.push('0');
    }
    digits.iter().rev().take(4).collect()
}

#[tauri::command]
pub fn create_bean(
    project_path: String,
    title: String,
    status: String,
    bean_type: String,
    parent: Option<String>,
    tags: Option<Vec<String>>,
    assignee: Option<String>,
    body: String,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
) -> Result<Bean, String> {
    let tags = tags.unwrap_or_default();
    let blocking = blocking.unwrap_or_default();
    let blocked_by = blocked_by.unwrap_or_default();

    // Read the project's .beans.yml to get the configured prefix.
    let beans_cfg = parse_beans_config(Path::new(&project_path));
    let prefix = beans_cfg.prefix.as_deref().unwrap_or("bean-");

    // Canonical id: {prefix}{random_4chars}  e.g. "beanstalk-9w17"
    let id = format!("{}{}", prefix, random_suffix());
    // Slug: full title → filename-safe lowercase string
    let slug = title_to_slug(&title);
    // Filename: {id}--{slug}.md  e.g. "beanstalk-9w17--feat-add-a-file-browser.md"
    let filename = format!("{}--{}.md", id, slug);

    // Ensure the .beans directory exists.
    let beans_dir = Path::new(&project_path).join(".beans");
    std::fs::create_dir_all(&beans_dir)
        .map_err(|e| format!("Failed to create .beans directory: {e}"))?;

    let file_path = beans_dir.join(&filename);

    // Build YAML frontmatter.
    let now = chrono_now_iso();
    // Tags block: omit entirely when empty (consistent with beans CLI).
    let tags_block = if tags.is_empty() {
        String::new()
    } else {
        let items = tags
            .iter()
            .map(|t| format!("    - {}", t))
            .collect::<Vec<_>>()
            .join("\n");
        format!("tags:\n{}\n", items)
    };

    let parent_line = match &parent {
        Some(p) => format!("parent: {}\n", p),
        None => String::new(),
    };
    let assignee_line = match &assignee {
        Some(a) => format!("assignee: {}\n", a),
        None => String::new(),
    };
    let blocking_block = yaml_id_list_block("blocking", &blocking);
    let blocked_by_block = yaml_id_list_block("blocked_by", &blocked_by);

    // Frontmatter id is written as a YAML comment `# {id}` (beans CLI format).
    let content = format!(
        "---\n# {}\ntitle: {}\nstatus: {}\ntype: {}\n{}{}{}{}{}created_at: {}\nupdated_at: {}\n---\n{}",
        id,
        yaml_quote_str(&title),
        status,
        bean_type,
        parent_line,
        assignee_line,
        tags_block,
        blocking_block,
        blocked_by_block,
        now,
        now,
        body
    );

    std::fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write bean file: {e}"))?;

    parse_bean_file(&file_path).map_err(|e| e.to_string())
}

// ── Update commands (beanstalk-kt0f) ────────────────────────────────────────

#[tauri::command]
pub fn update_bean(
    project_path: String,
    bean_id: String,
    title: Option<String>,
    status: Option<String>,
    tags: Option<Vec<String>>,
    assignee: Option<String>,
    body: Option<String>,
    parent: Option<Option<String>>,
    priority: Option<String>,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
) -> Result<Bean, String> {
    let existing = get_bean(project_path.clone(), bean_id.clone())?;
    let file_path_str = existing.file_path.clone();
    let file_path = Path::new(&file_path_str);

    let new_title = title.unwrap_or(existing.title.clone());
    let new_status = status.unwrap_or(existing.status.clone());
    let new_tags = tags.unwrap_or(existing.tags.clone());
    let new_assignee = assignee.or(existing.assignee.clone());
    let new_body = body.unwrap_or(existing.body.clone());
    // priority: Some("") = clear, Some("high") = set, None = keep existing
    let new_priority = match priority {
        Some(ref p) if p.is_empty() => None,
        Some(p) => Some(p),
        None => existing.priority.clone(),
    };
    // parent: Some(Some(id)) = set parent, Some(None) = clear parent, None = keep existing
    let new_parent = match parent {
        Some(p) => p,
        None => existing.parent.clone(),
    };
    let new_blocking = blocking.unwrap_or(existing.blocking.clone());
    let new_blocked_by = blocked_by.unwrap_or(existing.blocked_by.clone());

    let now = chrono_now_iso();
    let created_at = existing.created_at.as_deref().unwrap_or(&now).to_string();

    let tags_yaml = new_tags
        .iter()
        .map(|t| format!("  - {}", t))
        .collect::<Vec<_>>()
        .join("\n");
    let tags_block = if new_tags.is_empty() {
        "tags: []\n".to_string()
    } else {
        format!("tags:\n{}\n", tags_yaml)
    };

    let parent_line = match &new_parent {
        Some(p) => format!("parent: {}\n", p),
        None => String::new(),
    };
    let assignee_line = match &new_assignee {
        Some(a) => format!("assignee: {}\n", a),
        None => String::new(),
    };
    let priority_line = match &new_priority {
        Some(p) => format!("priority: {}\n", p),
        None => String::new(),
    };
    let blocking_block = yaml_id_list_block("blocking", &new_blocking);
    let blocked_by_block = yaml_id_list_block("blocked_by", &new_blocked_by);

    let content = format!(
        "---\nid: {}\ntitle: {}\nstatus: {}\ntype: {}\n{}{}{}{}{}{}created_at: {}\nupdated_at: {}\n---\n{}",
        existing.id,
        yaml_quote_str(&new_title),
        new_status,
        existing.bean_type,
        priority_line,
        parent_line,
        assignee_line,
        tags_block,
        blocking_block,
        blocked_by_block,
        created_at,
        now,
        new_body
    );

    std::fs::write(file_path, &content)
        .map_err(|e| format!("Failed to write bean file: {e}"))?;

    parse_bean_file(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_bean_status(
    project_path: String,
    bean_id: String,
    status: String,
) -> Result<Bean, String> {
    update_bean(project_path, bean_id, None, Some(status), None, None, None, None, None, None, None)
}

// ── Search command (beanstalk-lmx4) ─────────────────────────────────────────

#[tauri::command]
pub fn search_beans(
    project_path: String,
    query: String,
    status_filter: Option<String>,
    assignee_filter: Option<String>,
    tag_filter: Option<String>,
) -> Result<Vec<Bean>, String> {
    let path = Path::new(&project_path);
    let flat = scan_beans_directory(path).map_err(|e| e.to_string())?;

    let query_lower = query.to_lowercase();

    let results = flat
        .into_iter()
        .filter(|b| {
            // Text match: case-insensitive in title or body.
            let matches_query = query_lower.is_empty()
                || b.title.to_lowercase().contains(&query_lower)
                || b.body.to_lowercase().contains(&query_lower);

            let matches_status = status_filter
                .as_ref()
                .map(|s| b.status.eq_ignore_ascii_case(s))
                .unwrap_or(true);

            let matches_assignee = assignee_filter
                .as_ref()
                .map(|a| b.assignee.as_deref().map(|ba| ba.eq_ignore_ascii_case(a)).unwrap_or(false))
                .unwrap_or(true);

            let matches_tag = tag_filter
                .as_ref()
                .map(|t| b.tags.iter().any(|bt| bt.eq_ignore_ascii_case(t)))
                .unwrap_or(true);

            matches_query && matches_status && matches_assignee && matches_tag
        })
        .collect();

    Ok(results)
}

// ── Open in editor command (beanstalk-znwt) ──────────────────────────────────

#[tauri::command]
pub fn open_bean_in_editor(project_path: String, bean_id: String) -> Result<(), String> {
    let bean = get_bean(project_path, bean_id)?;
    let file_path = &bean.file_path;

    // Determine the editor: EDITOR > VISUAL > `open` (macOS default).
    let editor = std::env::var("EDITOR")
        .ok()
        .filter(|s| !s.is_empty())
        .or_else(|| std::env::var("VISUAL").ok().filter(|s| !s.is_empty()));

    match editor {
        Some(ed) => {
            std::process::Command::new(&ed)
                .arg(file_path)
                .spawn()
                .map_err(|e| format!("Failed to launch editor '{}': {e}", ed))?;
        }
        None => {
            // Fall back to macOS `open`, which uses the default app for .md files.
            std::process::Command::new("open")
                .arg(file_path)
                .spawn()
                .map_err(|e| format!("Failed to open file with default app: {e}"))?;
        }
    }

    Ok(())
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/// Generate a YAML block-sequence entry for a list of IDs, or empty string if empty.
fn yaml_id_list_block(key: &str, ids: &[String]) -> String {
    if ids.is_empty() {
        return String::new();
    }
    let items = ids
        .iter()
        .map(|id| format!("    - {}", id))
        .collect::<Vec<_>>()
        .join("\n");
    format!("{}:\n{}\n", key, items)
}

/// Double-quote a string value for safe inclusion in YAML block mappings.
/// Handles special characters (colons, hashes, brackets, quotes, newlines, etc.)
/// that would corrupt YAML if written unquoted.
fn yaml_quote_str(s: &str) -> String {
    let escaped = s
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r");
    format!("\"{}\"", escaped)
}

/// Return a basic ISO-8601 UTC timestamp using only std (no chrono crate).
fn chrono_now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    // Convert Unix seconds to a calendar date/time (no external crate).
    let (year, month, day, hour, min, sec) = unix_secs_to_datetime(secs);
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, hour, min, sec)
}

fn unix_secs_to_datetime(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
    let sec = (secs % 60) as u32;
    let min = ((secs / 60) % 60) as u32;
    let hour = ((secs / 3600) % 24) as u32;

    // Days since Unix epoch (1970-01-01).
    let mut days = secs / 86400;

    // Determine year.
    let mut year = 1970u32;
    loop {
        let days_in_year = if is_leap(year) { 366 } else { 365 };
        if days < days_in_year {
            break;
        }
        days -= days_in_year;
        year += 1;
    }

    // Determine month and day.
    let leap = is_leap(year);
    let month_days: &[u32] = if leap {
        &[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        &[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut month = 1u32;
    for &md in month_days {
        if (days as u32) < md {
            break;
        }
        days -= md as u64;
        month += 1;
    }
    let day = days as u32 + 1;

    (year, month, day, hour, min, sec)
}

fn is_leap(year: u32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    // ── Helper ────────────────────────────────────────────────────────────────

    /// Create a temporary directory that is removed when the guard is dropped.
    struct TempDir {
        path: PathBuf,
    }

    impl TempDir {
        fn new(suffix: &str) -> Self {
            let path = std::env::temp_dir().join(format!(
                "beanstalk_test_{}_{}",
                suffix,
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.subsec_nanos())
                    .unwrap_or(0)
            ));
            fs::create_dir_all(&path).expect("create temp dir");
            TempDir { path }
        }

        fn path(&self) -> &PathBuf {
            &self.path
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    // ── title_to_slug tests ──────────────────────────────────────────────────

    #[test]
    fn test_title_to_slug_basic() {
        assert_eq!(title_to_slug("Hello World"), "hello-world");
    }

    #[test]
    fn test_title_to_slug_colon_prefix() {
        // "FEAT: add a file browser" → "feat-add-a-file-browser"
        assert_eq!(title_to_slug("FEAT: add a file browser"), "feat-add-a-file-browser");
        assert_eq!(title_to_slug("FIX: move the button"), "fix-move-the-button");
    }

    #[test]
    fn test_title_to_slug_special_chars() {
        // Special characters become dashes, consecutive dashes collapse.
        assert_eq!(title_to_slug("hello--world"), "hello-world");
        assert_eq!(title_to_slug("  spaces  "), "spaces");
        assert_eq!(title_to_slug("a/b\\c"), "a-b-c");
    }

    #[test]
    fn test_title_to_slug_empty() {
        assert_eq!(title_to_slug(""), "bean");
        assert_eq!(title_to_slug(":::"), "bean");
    }

    // ── beanstalk-zc3m: generate_id_format ───────────────────────────────────

    #[test]
    fn test_generate_id_format() {
        // random_suffix() returns a non-empty string of exactly 4 base-36 chars.
        let suffix = random_suffix();
        assert!(!suffix.is_empty(), "random_suffix should not be empty");
        assert_eq!(suffix.len(), 4, "random_suffix should be 4 characters long");
        // All characters must be alphanumeric (base-36).
        assert!(
            suffix.chars().all(|c| c.is_ascii_alphanumeric()),
            "random_suffix chars must be alphanumeric, got: {}",
            suffix
        );
    }

    // ── beanstalk-xq94: create_bean tests ────────────────────────────────────

    #[test]
    fn test_create_bean_writes_file() {
        let tmp = TempDir::new("create_bean_writes");
        let project_path = tmp.path().to_string_lossy().to_string();

        let result = create_bean(
            project_path.clone(),
            "Test Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "some body".to_string(),
            None,
            None,
        );

        assert!(result.is_ok(), "create_bean should succeed: {:?}", result);
        let bean = result.unwrap();

        // Use the file_path reported by the bean — it holds the actual canonical path.
        let expected_file = PathBuf::from(&bean.file_path);

        assert!(
            expected_file.exists(),
            "bean .md file should exist at {:?}",
            expected_file
        );
    }

    #[test]
    fn test_create_bean_file_has_frontmatter() {
        let tmp = TempDir::new("create_bean_frontmatter");
        let project_path = tmp.path().to_string_lossy().to_string();

        let result = create_bean(
            project_path.clone(),
            "Frontmatter Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        );

        assert!(result.is_ok(), "create_bean should succeed: {:?}", result);
        let bean = result.unwrap();

        let content = fs::read_to_string(&bean.file_path).expect("read bean file");

        assert!(content.starts_with("---\n"), "file should start with '---' frontmatter delimiter");
        // Title is double-quoted for YAML safety.
        assert!(content.contains("\"Frontmatter Bean\""), "file should contain the quoted title in frontmatter");
        assert!(content.contains("---"), "file should have closing '---' delimiter");
        // Filename format: {id}--{slug}.md
        assert!(bean.file_path.contains("--frontmatter-bean"), "filename should contain slug from title");
    }

    // ── beanstalk-7kwy: get_beans / get_bean tests ───────────────────────────

    #[test]
    fn test_get_bean_not_found() {
        let tmp = TempDir::new("get_bean_not_found");
        // Create the .beans directory so scan_beans_directory does not fail.
        fs::create_dir_all(tmp.path().join(".beans")).unwrap();

        let result = get_bean(
            tmp.path().to_string_lossy().to_string(),
            "nonexistent-id-1234".to_string(),
        );

        assert!(result.is_err(), "get_bean should return Err for unknown id");
        let err = result.unwrap_err();
        assert!(
            err.contains("nonexistent-id-1234"),
            "error message should contain the unknown id, got: {}",
            err
        );
    }

    #[test]
    fn test_get_beans_empty_dir() {
        let tmp = TempDir::new("get_beans_empty");
        fs::create_dir_all(tmp.path().join(".beans")).unwrap();

        let result = get_beans(tmp.path().to_string_lossy().to_string());

        assert!(result.is_ok(), "get_beans should succeed on empty dir: {:?}", result);
        assert!(result.unwrap().is_empty(), "get_beans should return empty vec for empty .beans dir");
    }

    // ── beanstalk-k9yo: open_bean_in_editor tests ────────────────────────────

    #[test]
    fn test_open_bean_in_editor_missing_bean() {
        let tmp = TempDir::new("open_editor_missing");
        fs::create_dir_all(tmp.path().join(".beans")).unwrap();

        let result = open_bean_in_editor(
            tmp.path().to_string_lossy().to_string(),
            "totally-missing-bean".to_string(),
        );

        assert!(result.is_err(), "open_bean_in_editor should return Err for missing bean");
        let err = result.unwrap_err();
        assert!(
            !err.is_empty(),
            "error message for missing bean should not be empty"
        );
        // The error should describe which bean was not found.
        assert!(
            err.contains("totally-missing-bean") || err.contains("not found"),
            "descriptive error expected, got: {}",
            err
        );
    }

    // ── beanstalk-k16a: search_beans tests ───────────────────────────────────

    #[test]
    fn test_search_beans_empty() {
        let tmp = TempDir::new("search_empty");
        fs::create_dir_all(tmp.path().join(".beans")).unwrap();

        let result = search_beans(
            tmp.path().to_string_lossy().to_string(),
            "anything".to_string(),
            None,
            None,
            None,
        );

        assert!(result.is_ok(), "search_beans should succeed on empty dir");
        assert!(result.unwrap().is_empty(), "search on empty dir should return empty vec");
    }

    #[test]
    fn test_search_beans_title_match() {
        let tmp = TempDir::new("search_title");

        let result = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Unique Title Query".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        );
        assert!(result.is_ok());

        let search_result = search_beans(
            tmp.path().to_string_lossy().to_string(),
            "Unique Title".to_string(),
            None,
            None,
            None,
        );

        assert!(search_result.is_ok());
        let beans = search_result.unwrap();
        assert_eq!(beans.len(), 1, "should find exactly one matching bean");
        assert!(beans[0].title.contains("Unique Title Query"));
    }

    #[test]
    fn test_search_beans_case_insensitive() {
        let tmp = TempDir::new("search_case");

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "lowercase title here".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create_bean");

        let result = search_beans(
            tmp.path().to_string_lossy().to_string(),
            "LOWERCASE TITLE".to_string(),
            None,
            None,
            None,
        );

        assert!(result.is_ok());
        let beans = result.unwrap();
        assert_eq!(beans.len(), 1, "case-insensitive search should find the bean");
    }

    #[test]
    fn test_search_beans_status_filter() {
        let tmp = TempDir::new("search_status");

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Open Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create open bean");

        // Small sleep to ensure different random suffix.
        std::thread::sleep(std::time::Duration::from_millis(5));

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Done Bean".to_string(),
            "done".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create done bean");

        // Filter to only "done" status.
        let result = search_beans(
            tmp.path().to_string_lossy().to_string(),
            "".to_string(),
            Some("done".to_string()),
            None,
            None,
        );

        assert!(result.is_ok());
        let beans = result.unwrap();
        assert_eq!(beans.len(), 1, "status filter should return only 'done' beans");
        assert_eq!(beans[0].status, "done");
    }

    // ── beanstalk-ulq3: update_bean / update_bean_status tests ───────────────

    #[test]
    fn test_update_bean_status() {
        let tmp = TempDir::new("update_status");

        let bean = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Status Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create bean");

        let result = update_bean_status(
            tmp.path().to_string_lossy().to_string(),
            bean.id.clone(),
            "done".to_string(),
        );

        assert!(result.is_ok(), "update_bean_status should succeed: {:?}", result);
        let updated = result.unwrap();
        assert_eq!(updated.status, "done", "status should be updated to 'done'");

        // Verify the file on disk was updated.
        let file_content = fs::read_to_string(&updated.file_path).expect("read file");
        assert!(file_content.contains("status: done"), "file on disk should reflect new status");
    }

    #[test]
    fn test_update_bean_title() {
        let tmp = TempDir::new("update_title");

        let bean = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Original Title".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create bean");

        let result = update_bean(
            tmp.path().to_string_lossy().to_string(),
            bean.id.clone(),
            Some("Updated Title".to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );

        assert!(result.is_ok(), "update_bean should succeed: {:?}", result);
        let updated = result.unwrap();
        assert_eq!(updated.title, "Updated Title", "title should be updated");

        let file_content = fs::read_to_string(&updated.file_path).expect("read file");
        // Title is double-quoted for YAML safety.
        assert!(file_content.contains("\"Updated Title\""), "file should contain quoted new title");
    }

    #[test]
    fn test_update_bean_not_found() {
        let tmp = TempDir::new("update_not_found");
        fs::create_dir_all(tmp.path().join(".beans")).unwrap();

        let result = update_bean(
            tmp.path().to_string_lossy().to_string(),
            "ghost-id-9999".to_string(),
            Some("New Title".to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );

        assert!(result.is_err(), "update_bean should return Err for unknown id");
    }

    // ── yaml_quote_str tests (beanstalk-e5ce fix) ────────────────────────────

    #[test]
    fn test_yaml_quote_str_plain() {
        // Simple titles need no special treatment but are still double-quoted.
        let result = yaml_quote_str("My Bean Title");
        assert_eq!(result, "\"My Bean Title\"");
    }

    #[test]
    fn test_yaml_quote_str_with_hash() {
        // A hash preceded by a space is a YAML comment marker — must be quoted.
        let result = yaml_quote_str("Fix #123 issue");
        assert_eq!(result, "\"Fix #123 issue\"");
        // Verify serde_yaml can parse the output as the original string.
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("Fix #123 issue"));
    }

    #[test]
    fn test_yaml_quote_str_leading_hash() {
        // Title that starts with '#' — without quoting, serde_yaml sees a comment.
        let result = yaml_quote_str("#123: boot crash");
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("#123: boot crash"));
    }

    #[test]
    fn test_yaml_quote_str_with_brackets() {
        // '[' at start of a YAML value begins a flow sequence — must be quoted.
        let result = yaml_quote_str("[Bug] Something broke");
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("[Bug] Something broke"));
    }

    #[test]
    fn test_yaml_quote_str_with_colon() {
        // Colons in values are legal as unquoted scalars, but quoting is safe.
        let result = yaml_quote_str("Fix: status update");
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("Fix: status update"));
    }

    #[test]
    fn test_yaml_quote_str_with_double_quote() {
        // Internal double-quotes must be escaped.
        let result = yaml_quote_str("She said \"hello\"");
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("She said \"hello\""));
    }

    #[test]
    fn test_yaml_quote_str_with_backslash() {
        // Backslashes must be escaped.
        let result = yaml_quote_str("path\\to\\file");
        let yaml = format!("title: {}", result);
        let map: std::collections::HashMap<String, serde_yaml::Value> =
            serde_yaml::from_str(&yaml).expect("must parse");
        assert_eq!(map["title"].as_str(), Some("path\\to\\file"));
    }

    // ── title round-trip tests ────────────────────────────────────────────────

    #[test]
    fn test_create_bean_title_with_special_chars_roundtrips() {
        // A title with '#' and '[' should survive a create → parse round-trip.
        let tmp = TempDir::new("title_special_create");
        let project_path = tmp.path().to_string_lossy().to_string();

        let tricky_title = "[Bug] Fix #42: edge case";
        let bean = create_bean(
            project_path.clone(),
            tricky_title.to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create_bean should succeed");

        assert_eq!(bean.title, tricky_title, "title must survive create round-trip");

        // Re-read from disk to confirm the file on disk is also correct.
        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find created bean");
        assert_eq!(on_disk.title, tricky_title, "title on disk must match original");
    }

    #[test]
    fn test_update_bean_title_with_special_chars_roundtrips() {
        // A title with YAML-special characters should survive an update → parse round-trip.
        let tmp = TempDir::new("title_special_update");
        let project_path = tmp.path().to_string_lossy().to_string();

        let original_title = "Original Title";
        let tricky_title = "#1: fix [critical] issue \"urgent\"";

        let bean = create_bean(
            project_path.clone(),
            original_title.to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let updated = update_bean(
            project_path.clone(),
            bean.id.clone(),
            Some(tricky_title.to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        )
        .expect("update_bean should succeed");

        assert_eq!(updated.title, tricky_title, "title must survive update round-trip");

        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find updated bean");
        assert_eq!(on_disk.title, tricky_title, "title on disk must match updated value");
    }

    #[test]
    fn test_update_bean_status_preserves_special_char_title() {
        // update_bean_status (None title) must preserve a title with special chars.
        let tmp = TempDir::new("status_preserves_title");
        let project_path = tmp.path().to_string_lossy().to_string();

        let tricky_title = "[Bug] status change clears title #99";

        let bean = create_bean(
            project_path.clone(),
            tricky_title.to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            "".to_string(),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let updated = update_bean_status(
            project_path.clone(),
            bean.id.clone(),
            "done".to_string(),
        )
        .expect("update_bean_status should succeed");

        assert_eq!(updated.status, "done", "status must be updated");
        assert_eq!(updated.title, tricky_title, "title must be preserved after status change");

        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find updated bean");
        assert_eq!(on_disk.title, tricky_title, "title on disk must be preserved");
        assert_eq!(on_disk.status, "done", "status on disk must be 'done'");
    }
}
