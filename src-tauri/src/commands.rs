// Tauri commands for bean CRUD operations (beanstalk-v5m3)

use std::path::{Path, PathBuf};

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
    priority: Option<String>,
    body: Option<String>,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
) -> Result<Bean, String> {
    let tags = tags.unwrap_or_default();
    let blocking = blocking.unwrap_or_default();
    let blocked_by = blocked_by.unwrap_or_default();
    let body = body.unwrap_or_default();

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
    let priority_line = match &priority {
        Some(p) if !p.is_empty() => format!("priority: {}\n", p),
        _ => String::new(),
    };
    let blocking_block = yaml_id_list_block("blocking", &blocking);
    let blocked_by_block = yaml_id_list_block("blocked_by", &blocked_by);

    // Frontmatter id is written as a YAML comment `# {id}` (beans CLI format).
    let content = format!(
        "---\n# {}\ntitle: {}\nstatus: {}\ntype: {}\n{}{}{}{}{}{}created_at: {}\nupdated_at: {}\n---\n{}",
        id,
        yaml_quote_str(&title),
        status,
        bean_type,
        parent_line,
        assignee_line,
        priority_line,
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
    parent: Option<String>,
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
    // parent: Some("") = clear, Some(id) = set, None = keep existing
    let new_parent = match parent {
        Some(ref p) if p.is_empty() => None,
        Some(p) => Some(p),
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

/// The default GUI editors to try, in order, when no editor is configured in
/// settings. TextEdit ships with macOS and is always present, so it is the
/// guaranteed final fallback.
const DEFAULT_EDITOR_APPS: [&str; 3] = ["Neovide", "Visual Studio Code", "TextEdit"];

/// What to launch when opening a bean file.
#[derive(Debug, PartialEq)]
enum EditorChoice {
    /// A user-configured editor command (may include arguments), spawned directly.
    Command(String),
    /// No editor configured: try these macOS apps in order via `open -a`.
    AppChain(Vec<String>),
}

/// Decide how to open a bean file. A non-blank editor configured in the app
/// settings always wins (the escape hatch); otherwise fall back to the default
/// GUI app chain (Neovide → VS Code → TextEdit).
///
/// Note: unlike the previous behavior, the shell's $EDITOR/$VISUAL are
/// intentionally *not* consulted — those commonly point at terminal editors
/// (e.g. nvim) which cannot be spawned from a GUI process and fail silently.
fn resolve_editor_choice(configured: Option<String>) -> EditorChoice {
    match configured
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
    {
        Some(cmd) => EditorChoice::Command(cmd),
        None => EditorChoice::AppChain(
            DEFAULT_EDITOR_APPS.iter().map(|s| s.to_string()).collect(),
        ),
    }
}

/// Directories where CLI editors are commonly installed (e.g. Homebrew) but
/// which are missing from a macOS GUI app's inherited PATH. A `.app` bundle
/// launched from Finder does not see the login shell's PATH, so a configured
/// editor like `neovide` (installed at /opt/homebrew/bin) would otherwise fail
/// to spawn.
const EXTRA_PATH_DIRS: [&str; 3] = ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin"];

/// The inherited `PATH` with `EXTRA_PATH_DIRS` appended (skipping any already
/// present). Used both to resolve the configured editor binary and as the child
/// process's PATH so the editor's own subprocesses have a sane environment.
pub(crate) fn augmented_path() -> String {
    let inherited = std::env::var("PATH").unwrap_or_default();
    let mut dirs: Vec<String> = if inherited.is_empty() {
        Vec::new()
    } else {
        inherited.split(':').map(|s| s.to_string()).collect()
    };
    for extra in EXTRA_PATH_DIRS {
        if !dirs.iter().any(|d| d == extra) {
            dirs.push(extra.to_string());
        }
    }
    dirs.join(":")
}

/// Resolve `program` to an executable path. A program containing a path
/// separator is used as-is when it exists; a bare name is searched for across
/// the augmented PATH. Returns `None` when no matching file is found.
fn resolve_program_path(program: &str) -> Option<PathBuf> {
    if program.contains('/') {
        let p = PathBuf::from(program);
        return if p.exists() { Some(p) } else { None };
    }
    for dir in augmented_path().split(':') {
        if dir.is_empty() {
            continue;
        }
        let candidate = Path::new(dir).join(program);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

/// How to launch a configured editor's program.
#[derive(Debug, PartialEq)]
enum EditorTarget {
    /// A macOS `.app` bundle path — launch via `open -a`.
    AppBundle(String),
    /// A resolved executable — spawn directly (arguments preserved).
    Binary(PathBuf),
    /// A bare name that is not an executable — treat as a macOS app name and
    /// launch via `open -a` (e.g. `neovide` -> Neovide.app).
    AppName(String),
}

/// Classify a configured editor's program token into how it should be launched.
fn classify_editor_program(program: &str) -> EditorTarget {
    if program.ends_with(".app") {
        EditorTarget::AppBundle(program.to_string())
    } else if let Some(path) = resolve_program_path(program) {
        EditorTarget::Binary(path)
    } else {
        EditorTarget::AppName(program.to_string())
    }
}

/// Launch a configured editor command (e.g. "code --wait", "neovide", or
/// "/Applications/Neovide.app") on `file_path`. Real binaries are spawned
/// directly with their arguments; `.app` bundles and bare app names are opened
/// via `open -a`.
fn launch_editor_command(command: &str, file_path: &str) -> Result<(), String> {
    let mut parts = command.split_whitespace();
    let program = parts
        .next()
        .ok_or_else(|| "Configured editor is empty".to_string())?;
    let rest: Vec<&str> = parts.collect();

    match classify_editor_program(program) {
        EditorTarget::AppBundle(app) | EditorTarget::AppName(app) => {
            open_with_app(&app, file_path)
        }
        EditorTarget::Binary(bin) => {
            std::process::Command::new(bin)
                .args(rest)
                .arg(file_path)
                .env("PATH", augmented_path())
                .spawn()
                .map_err(|e| format!("Failed to launch editor '{}': {e}", command))?;
            Ok(())
        }
    }
}

/// Open `file_path` in a macOS application by name via `open -a`. Returns an
/// error (without launching anything) when the app is not installed, so the
/// caller can try the next candidate in the chain.
fn open_with_app(app: &str, file_path: &str) -> Result<(), String> {
    let status = std::process::Command::new("open")
        .arg("-a")
        .arg(app)
        .arg(file_path)
        .status()
        .map_err(|e| format!("Failed to run `open`: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("Application '{}' is not available", app))
    }
}

#[tauri::command]
pub fn open_bean_in_editor(project_path: String, bean_id: String) -> Result<(), String> {
    let bean = get_bean(project_path, bean_id)?;
    let file_path = &bean.file_path;

    match resolve_editor_choice(crate::config::load_config().editor) {
        EditorChoice::Command(cmd) => launch_editor_command(&cmd, file_path),
        EditorChoice::AppChain(apps) => {
            // Try each app in order; stop at the first one that launches.
            let mut last_err = String::from("No editor available");
            for app in &apps {
                match open_with_app(app, file_path) {
                    Ok(()) => return Ok(()),
                    Err(e) => last_err = e,
                }
            }
            Err(last_err)
        }
    }
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
            None,
            Some("some body".to_string()),
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
            None,
            Some("".to_string()),
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

    // ── beanstalk-gnhq: editor choice resolution ─────────────────────────────

    #[test]
    fn test_resolve_editor_choice_configured_wins() {
        // A configured editor is the escape hatch and always wins, even though
        // $EDITOR is set in the ambient environment.
        std::env::set_var("EDITOR", "nvim");
        assert_eq!(
            resolve_editor_choice(Some("code --wait".to_string())),
            EditorChoice::Command("code --wait".to_string())
        );
        std::env::remove_var("EDITOR");
    }

    #[test]
    fn test_resolve_editor_choice_trims_configured() {
        assert_eq!(
            resolve_editor_choice(Some("  neovide  ".to_string())),
            EditorChoice::Command("neovide".to_string())
        );
    }

    #[test]
    fn test_resolve_editor_choice_default_chain_when_unconfigured() {
        // Blank and None both fall back to the default app chain, in order.
        let expected = EditorChoice::AppChain(vec![
            "Neovide".to_string(),
            "Visual Studio Code".to_string(),
            "TextEdit".to_string(),
        ]);
        assert_eq!(resolve_editor_choice(None), expected);
        assert_eq!(resolve_editor_choice(Some("   ".to_string())), expected);
    }

    #[test]
    fn test_augmented_path_includes_homebrew() {
        // The augmented PATH always contains the Homebrew bin dir so a GUI app
        // (whose inherited PATH omits it) can still find CLI editors.
        assert!(augmented_path()
            .split(':')
            .any(|d| d == "/opt/homebrew/bin"));
    }

    #[test]
    fn test_resolve_program_path_absolute() {
        // A program given by path resolves to that path when it exists...
        assert_eq!(resolve_program_path("/bin/ls"), Some(PathBuf::from("/bin/ls")));
        // ...and to None when it does not.
        assert_eq!(resolve_program_path("/bin/no-such-binary-xyz"), None);
    }

    #[test]
    fn test_resolve_program_path_bare_name() {
        // A bare name is found on the augmented PATH...
        assert!(resolve_program_path("ls").is_some());
        // ...and an unknown name resolves to nothing.
        assert_eq!(resolve_program_path("definitely-not-a-real-binary-xyz"), None);
    }

    #[test]
    fn test_classify_editor_program() {
        // A .app path is an app bundle regardless of whether it exists on disk.
        assert_eq!(
            classify_editor_program("/Applications/Neovide.app"),
            EditorTarget::AppBundle("/Applications/Neovide.app".to_string())
        );
        // A resolvable binary classifies as Binary.
        match classify_editor_program("ls") {
            EditorTarget::Binary(_) => {}
            other => panic!("expected Binary, got {other:?}"),
        }
        // A bare name that is not an executable falls back to an app name, so
        // `open -a <name>` can find the matching macOS application.
        assert_eq!(
            classify_editor_program("no-such-binary-xyz"),
            EditorTarget::AppName("no-such-binary-xyz".to_string())
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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

    #[test]
    fn test_update_bean_clears_parent_with_empty_string() {
        // Regression for beanstalk-du57: removing a parent via UI edit must persist.
        // Frontend sends "" to mean "clear"; backend must drop the parent field.
        let tmp = TempDir::new("update_clear_parent");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "Child Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            Some("parent-abc".to_string()),
            Some(vec![]),
            None,
            None,
            Some("".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");
        assert_eq!(bean.parent.as_deref(), Some("parent-abc"));

        let updated = update_bean(
            project_path.clone(),
            bean.id.clone(),
            None,
            None,
            None,
            None,
            None,
            Some("".to_string()),
            None,
            None,
            None,
        )
        .expect("update_bean should succeed");

        assert!(updated.parent.is_none(), "empty-string parent should clear it");
        let on_disk = fs::read_to_string(&updated.file_path).expect("read file");
        assert!(!on_disk.contains("parent:"), "parent line should be absent from file");
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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
            None,
            Some("".to_string()),
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

    // ── priority round-trip tests (beanstalk-xgaq fix) ───────────────────────

    #[test]
    fn test_create_bean_with_priority_roundtrips() {
        // A priority value passed to create_bean should appear in the written file
        // and be returned in the Bean struct (round-trip).
        let tmp = TempDir::new("create_priority");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "Priority Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("high".to_string()),
            Some("".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");

        // Priority must be returned in the Bean struct.
        assert_eq!(
            bean.priority.as_deref(),
            Some("high"),
            "priority must be 'high' in returned Bean"
        );

        // Priority must be written to the file on disk.
        let content = fs::read_to_string(&bean.file_path).expect("read bean file");
        assert!(
            content.contains("priority: high"),
            "file on disk must contain 'priority: high', got:\n{}",
            content
        );

        // Re-read from disk to confirm round-trip.
        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find created bean");
        assert_eq!(
            on_disk.priority.as_deref(),
            Some("high"),
            "priority on disk must match original after re-read"
        );
    }

    #[test]
    fn test_create_bean_without_priority_omits_field() {
        // When priority is None, the frontmatter must not contain a priority line.
        let tmp = TempDir::new("create_no_priority");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "No Priority Bean".to_string(),
            "open".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            None,
            Some("".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let content = fs::read_to_string(&bean.file_path).expect("read bean file");
        assert!(
            !content.contains("priority:"),
            "file should not contain a priority line when priority is None, got:\n{}",
            content
        );

        assert!(
            bean.priority.is_none(),
            "returned Bean.priority should be None when not set"
        );
    }
}
