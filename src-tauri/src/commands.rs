// Tauri commands for bean CRUD operations (beanstalk-v5m3)

use std::path::{Path, PathBuf};

use crate::beans::{scan_beans_directory, build_tree, Bean};
use crate::beanscli::{diff_list_args, run_beans, BeansCliError};

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




#[tauri::command]
pub fn create_bean(
    project_path: String,
    title: String,
    status: String,
    bean_type: String,
    parent: Option<String>,
    tags: Option<Vec<String>>,
    priority: Option<String>,
    body: Option<String>,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
) -> Result<Bean, BeansCliError> {
    // `beans` refuses a data directory that does not exist rather than creating
    // one, so a first bean in a fresh project needs this.
    let beans_dir = Path::new(&project_path).join(".beans");
    std::fs::create_dir_all(&beans_dir)
        .map_err(|e| BeansCliError::new("IO_FAILED", format!("could not create {beans_dir:?}: {e}")))?;

    let mut args: Vec<String> = vec!["create".to_string(), title];
    args.push("-s".to_string());
    args.push(status);
    args.push("-t".to_string());
    args.push(bean_type);

    if let Some(p) = parent.filter(|p| !p.is_empty()) {
        args.push("--parent".to_string());
        args.push(p);
    }
    if let Some(p) = priority.filter(|p| !p.is_empty()) {
        args.push("-p".to_string());
        args.push(p);
    }
    for tag in tags.unwrap_or_default() {
        args.push("--tag".to_string());
        args.push(tag);
    }
    for id in blocking.unwrap_or_default() {
        args.push("--blocking".to_string());
        args.push(id);
    }
    for id in blocked_by.unwrap_or_default() {
        args.push("--blocked-by".to_string());
        args.push(id);
    }

    // An empty body is not worth a stdin round trip, and `-d -` with no input
    // is a needless difference from omitting the flag.
    let body = body.unwrap_or_default();
    let stdin_body = if body.is_empty() { None } else { Some(body.as_str()) };
    if stdin_body.is_some() {
        args.push("-d".to_string());
        args.push("-".to_string());
    }

    let out = run_beans(Path::new(&project_path), &args, stdin_body)?;

    // The id is minted by beans (from the project's configured prefix), so it
    // has to come back out of the response before the bean can be re-read.
    let created: CreateEnvelope = serde_json::from_str(&out)
        .map_err(|e| BeansCliError::new("PARSE_FAILED", format!("could not read `beans create` output: {e}")))?;

    get_bean(project_path, created.bean.id).map_err(|e| BeansCliError::new("READ_FAILED", e))
}

/// Just enough of `beans create --json` to recover the minted id.
#[derive(Debug, serde::Deserialize)]
struct CreateEnvelope {
    bean: CreatedBean,
}

#[derive(Debug, serde::Deserialize)]
struct CreatedBean {
    id: String,
}

// ── Update commands (beanstalk-kt0f) ────────────────────────────────────────

/// Update a bean by delegating to the `beans` CLI (beanstalk-dg1m).
///
/// `expect_body` is the body the caller based its edit on. When supplied, the
/// write is refused unless the body still on disk matches it (beanstalk-ep8j).
/// Only the body needs this guard: every other field is omitted when unchanged
/// and therefore taken from disk anyway, but the body *is* the field being
/// replaced, so there is nothing to preserve it from.
///
/// Deliberately not `beans --if-match`. That compares against an etag the write
/// path computes *after* applying defaults, which never matches the etag the
/// read path reports for a bean missing a defaulted key -- and since a reload
/// re-reads through the read path, such a bean could never be saved. 13 of 173
/// beans across this user's projects are in exactly that state.
#[tauri::command]
pub fn update_bean(
    project_path: String,
    bean_id: String,
    title: Option<String>,
    status: Option<String>,
    tags: Option<Vec<String>>,
    body: Option<String>,
    parent: Option<String>,
    priority: Option<String>,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
    expect_body: Option<String>,
) -> Result<Bean, BeansCliError> {
    // Read first: tags and relations are set incrementally by the CLI, so a
    // "set this list" from the UI has to be diffed against what is on disk.
    let existing = get_bean(project_path.clone(), bean_id.clone())
        .map_err(|e| BeansCliError::new("READ_FAILED", e))?;

    // Checked here rather than in the frontend so the window between reading and
    // writing is as small as it can be without the CLI's help.
    if let Some(expected) = &expect_body {
        // Compare fully trimmed. `beans` writes a blank line after the closing
        // `---`, so a parsed body carries a leading newline the editor never
        // showed, and normalises the trailing one. Comparing raw would make the
        // guard fire on every save, which is worse than not having it.
        if existing.body.trim() != expected.trim() {
            return Err(BeansCliError::new(
                "CONFLICT",
                "This bean changed on disk while you were editing it. Your text has \
                 not been written, and nothing was overwritten. Reload to see the \
                 current version, or open it in the external editor to reconcile.",
            ));
        }
    }

    let mut args: Vec<String> = vec!["update".to_string(), bean_id.clone()];

    if let Some(t) = &title {
        args.push("--title".to_string());
        args.push(t.clone());
    }
    if let Some(st) = &status {
        args.push("-s".to_string());
        args.push(st.clone());
    }
    // An empty priority clears it, which is what the CLI documents.
    if let Some(p) = &priority {
        args.push("-p".to_string());
        args.push(p.clone());
    }
    // Parent has a dedicated clear flag rather than an empty-value convention.
    match &parent {
        Some(p) if p.is_empty() => args.push("--remove-parent".to_string()),
        Some(p) => {
            args.push("--parent".to_string());
            args.push(p.clone());
        }
        None => {}
    }
    if let Some(desired) = &tags {
        args.extend(diff_list_args("--tag", "--remove-tag", &existing.tags, desired));
    }
    if let Some(desired) = &blocking {
        args.extend(diff_list_args("--blocking", "--remove-blocking", &existing.blocking, desired));
    }
    if let Some(desired) = &blocked_by {
        args.extend(diff_list_args("--blocked-by", "--remove-blocked-by", &existing.blocked_by, desired));
    }

    // Stream the body rather than passing it in argv: no escaping, no size limit.
    let stdin_body = body.as_deref();
    if stdin_body.is_some() {
        args.push("-d".to_string());
        args.push("-".to_string());
    }

    // `beans update` refuses a call with no changes (VALIDATION_ERROR). The Touch
    // button is the legitimate caller of that shape, so express it as re-setting
    // the current status, which bumps `updated_at` without altering anything.
    if args.len() == 2 {
        args.push("-s".to_string());
        args.push(existing.status.clone());
    }

    run_beans(Path::new(&project_path), &args, stdin_body)?;

    // Re-read through Beanstalk's own parser rather than mapping the CLI's JSON,
    // and by id rather than by path, so a future rename cannot strand us.
    get_bean(project_path, bean_id).map_err(|e| BeansCliError::new("READ_FAILED", e))
}

#[tauri::command]
pub fn update_bean_status(
    project_path: String,
    bean_id: String,
    status: String,
) -> Result<Bean, BeansCliError> {
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
#[cfg(target_os = "macos")]
const DEFAULT_EDITOR_APPS: [&str; 3] = ["Neovide", "Visual Studio Code", "TextEdit"];

/// The default editors to try, in order, when no editor is configured in
/// settings. Unlike macOS these are plain executables resolved on PATH, so the
/// list can end with `xdg-open`: it ships with xdg-utils (pulled in by every
/// desktop environment) and hands the file to whatever the user registered for
/// its MIME type, making it the guaranteed final fallback.
#[cfg(not(target_os = "macos"))]
const DEFAULT_EDITOR_APPS: [&str; 5] = [
    "neovide",
    "code",
    "gnome-text-editor",
    "gedit",
    "xdg-open",
];

/// What to launch when opening a bean file.
#[derive(Debug, PartialEq)]
enum EditorChoice {
    /// A user-configured editor command (may include arguments), spawned directly.
    Command(String),
    /// No editor configured: try these apps in order, stopping at the first
    /// one that launches. See `open_with_app` for what "app" means per platform.
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

/// Directories where CLI editors are commonly installed but which a GUI
/// process's inherited PATH may omit. Neither a `.app` bundle launched from
/// Finder nor an app launched from a `.desktop` entry sees the login shell's
/// PATH, so a configured editor like `neovide` would otherwise fail to spawn.
fn extra_path_dirs() -> Vec<String> {
    #[cfg(target_os = "macos")]
    {
        ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin"]
            .iter()
            .map(|s| s.to_string())
            .collect()
    }
    #[cfg(not(target_os = "macos"))]
    {
        let mut paths: Vec<String> = ["/usr/local/bin", "/var/lib/flatpak/exports/bin"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        // Per-user installs (`cargo install`, pipx, `pip --user`) land here and
        // are the most likely editor location a desktop session's PATH misses.
        if let Some(home) = dirs::home_dir() {
            paths.push(home.join(".local/bin").to_string_lossy().into_owned());
        }
        paths
    }
}

/// The inherited `PATH` with `extra_path_dirs()` appended (skipping any already
/// present). Used both to resolve the configured editor binary and as the child
/// process's PATH so the editor's own subprocesses have a sane environment.
pub(crate) fn augmented_path() -> String {
    let inherited = std::env::var("PATH").unwrap_or_default();
    let mut dirs: Vec<String> = if inherited.is_empty() {
        Vec::new()
    } else {
        inherited.split(':').map(|s| s.to_string()).collect()
    };
    for extra in extra_path_dirs() {
        if !dirs.iter().any(|d| d == &extra) {
            dirs.push(extra);
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
    /// A macOS `.app` bundle path — hand to `open_with_app`. Not meaningful on
    /// other platforms, where it simply reports the bundle as unavailable.
    AppBundle(String),
    /// A resolved executable — spawn directly (arguments preserved).
    Binary(PathBuf),
    /// A bare name that is not an executable on PATH — hand to `open_with_app`,
    /// which on macOS resolves it as an application name (`neovide` ->
    /// Neovide.app) and elsewhere reports it as unavailable.
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
/// directly with their arguments; `.app` bundles and bare app names go through
/// `open_with_app`.
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
#[cfg(target_os = "macos")]
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

/// Open `file_path` with `app` on non-macOS platforms. There is no `open -a`
/// equivalent — an "app" here is just an executable on the augmented PATH,
/// invoked as `app <file>`, which covers both the default chain (ending at
/// `xdg-open`) and a configured program name. Returns an error *without*
/// launching anything when the program is not installed, so the caller can try
/// the next candidate in the chain.
///
/// Spawned rather than waited on: unlike `open -a`, which returns as soon as it
/// has handed the file off, these are the editors themselves and would block
/// the command until the user closed the window.
#[cfg(not(target_os = "macos"))]
fn open_with_app(app: &str, file_path: &str) -> Result<(), String> {
    let bin = resolve_program_path(app)
        .ok_or_else(|| format!("Application '{}' is not available", app))?;
    std::process::Command::new(bin)
        .arg(file_path)
        .env("PATH", augmented_path())
        .spawn()
        .map_err(|e| format!("Failed to launch '{}': {e}", app))?;
    Ok(())
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






// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    /// Writes go through the real `beans` binary (beanstalk-dg1m), so the tests
    /// that exercise them are integration tests. Skip rather than fail where the
    /// binary is absent: a missing CLI is a legitimate environment, and the unit
    /// coverage for argument building lives in `crate::beanscli`.
    macro_rules! require_beans {
        () => {
            if crate::beanscli::resolve_beans_bin(None).is_none() {
                eprintln!("skipping: `beans` not installed");
                return;
            }
        };
    }

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


    // ── beanstalk-zc3m: generate_id_format ───────────────────────────────────

    // ── beanstalk-xq94: create_bean tests ────────────────────────────────────

    #[test]
    fn test_create_bean_writes_file() {
        require_beans!();
        let tmp = TempDir::new("create_bean_writes");
        let project_path = tmp.path().to_string_lossy().to_string();

        let result = create_bean(
            project_path.clone(),
            "Test Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("some body".to_string()),
            None,
            None);

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
        require_beans!();
        let tmp = TempDir::new("create_bean_frontmatter");
        let project_path = tmp.path().to_string_lossy().to_string();

        let result = create_bean(
            project_path.clone(),
            "Frontmatter Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None);

        assert!(result.is_ok(), "create_bean should succeed: {:?}", result);
        let bean = result.unwrap();

        let content = fs::read_to_string(&bean.file_path).expect("read bean file");

        assert!(content.starts_with("---\n"), "file should start with '---' frontmatter delimiter");
        // How the title is quoted is `beans`' business now that it owns the
        // writer, so assert the value round-trips rather than its YAML style.
        assert_eq!(bean.title, "Frontmatter Bean", "title should round-trip");
        assert!(content.contains("Frontmatter Bean"), "file should contain the title");
        assert!(content.contains("---"), "file should have closing '---' delimiter");
        // Filename format: {id}--{slug}.md
        assert!(bean.file_path.contains("--frontmatter-bean"), "filename should contain slug from title");
    }

    // ── beanstalk-dg1m: writes go through the `beans` CLI ────────────────────

    /// The regression this milestone exists for.
    ///
    /// Beanstalk used to build bean files from its own `format!` template, which
    /// wrote the id as an `id:` key while the CLI writes it as a `# <id>` comment,
    /// quoted titles the CLI leaves bare, and materialised `tags: []`. 30 of 31
    /// files in this repo used the comment form; the single file Beanstalk had
    /// ever saved was the only one with an `id:` key.
    #[test]
    fn test_create_bean_writes_the_cli_frontmatter_format() {
        require_beans!();
        let tmp = TempDir::new("cli_format_create");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path,
            "Format Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let content = fs::read_to_string(&bean.file_path).expect("read bean file");

        assert!(
            content.contains(&format!("# {}", bean.id)),
            "id must be written as a YAML comment, as the CLI does; got:\n{content}"
        );
        assert!(
            !content.contains(&format!("id: {}", bean.id)),
            "id must NOT be written as an `id:` key -- that was the template's signature;\ngot:\n{content}"
        );
        assert!(
            !content.contains("tags: []"),
            "an empty tags key must not be materialised; got:\n{content}"
        );
    }

    #[test]
    fn test_update_bean_preserves_the_cli_id_comment() {
        require_beans!();
        let tmp = TempDir::new("cli_format_update");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "Round Trip".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("body".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let updated = update_bean(
            project_path,
            bean.id.clone(),
            None,
            Some("in-progress".to_string()),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        )
        .expect("update_bean should succeed");

        let content = fs::read_to_string(&updated.file_path).expect("read bean file");
        assert!(
            content.contains(&format!("# {}", bean.id)),
            "a save must not rewrite the id comment into an `id:` key; got:\n{content}"
        );
        assert!(!content.contains(&format!("id: {}", bean.id)));
        assert_eq!(updated.status, "in-progress");
        assert_eq!(updated.body.trim(), "body", "body must survive a frontmatter-only update");
    }

    /// `beans` validates against project config; the old template writer did not.
    #[test]
    fn test_invalid_status_is_rejected_rather_than_written() {
        require_beans!();
        let tmp = TempDir::new("cli_validates");
        let project_path = tmp.path().to_string_lossy().to_string();

        let result = create_bean(
            project_path,
            "Bad Status".to_string(),
            "open".to_string(), // not a beans status
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None,
        );

        let err = result.expect_err("an invalid status must not be written");
        assert!(
            err.code.contains("STATUS") || err.code == "VALIDATION_ERROR",
            "expected a status validation code, got {err:?}"
        );
    }

    /// Touch has no CLI equivalent (a flagless update is refused), so it is
    /// expressed as re-setting the current status.
    #[test]
    fn test_update_with_no_changes_behaves_as_touch() {
        require_beans!();
        let tmp = TempDir::new("cli_touch");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "Touchable".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed");

        let touched = update_bean(
            project_path,
            bean.id.clone(),
            None, None, None, None, None, None, None, None,
            None,
        )
        .expect("a no-change update must succeed rather than erroring");

        assert_eq!(touched.status, bean.status, "status must be unchanged");
        assert_eq!(touched.title, bean.title, "title must be unchanged");
    }

    // ── beanstalk-ep8j: lost-update guard ────────────────────────────────────

    /// Helper: a bean with a known body, ready to be raced.
    fn seed_body_bean(project_path: &str, body: &str) -> Bean {
        create_bean(
            project_path.to_string(),
            "Raceable".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some(body.to_string()),
            None,
            None,
        )
        .expect("create_bean should succeed")
    }

    #[test]
    fn test_body_write_succeeds_when_disk_still_matches() {
        require_beans!();
        let tmp = TempDir::new("guard_clean");
        let project_path = tmp.path().to_string_lossy().to_string();
        let bean = seed_body_bean(&project_path, "Base body.");

        let updated = update_bean(
            project_path,
            bean.id.clone(),
            None, None, None,
            Some("My edit.".to_string()),
            None, None, None, None,
            Some("Base body.".to_string()),
        )
        .expect("an unchanged base must not be treated as a conflict");

        assert_eq!(updated.body.trim(), "My edit.");
    }

    #[test]
    fn test_body_write_is_refused_when_disk_changed_underneath() {
        require_beans!();
        let tmp = TempDir::new("guard_conflict");
        let project_path = tmp.path().to_string_lossy().to_string();
        let bean = seed_body_bean(&project_path, "Base body.");

        // Someone else — an agent running `beans update --body-append`, say —
        // changes the body while the edit is open.
        update_bean(
            project_path.clone(),
            bean.id.clone(),
            None, None, None,
            Some("Base body.\n\nAppended by an agent.".to_string()),
            None, None, None, None,
            None,
        )
        .expect("the concurrent write should succeed");

        let err = update_bean(
            project_path.clone(),
            bean.id.clone(),
            None, None, None,
            Some("My edit.".to_string()),
            None, None, None, None,
            Some("Base body.".to_string()),
        )
        .expect_err("a stale base must be refused");

        assert_eq!(err.code, "CONFLICT", "must be distinguishable from other failures");

        // Nothing was overwritten: the agent's text is still there.
        let on_disk = get_bean(project_path, bean.id).expect("bean should still exist");
        assert!(
            on_disk.body.contains("Appended by an agent."),
            "the concurrent change must survive; got: {:?}",
            on_disk.body
        );
        assert!(!on_disk.body.contains("My edit."), "the refused edit must not be written");
    }

    #[test]
    fn test_guard_is_skipped_when_no_base_is_supplied() {
        require_beans!();
        // Writes that do not touch the body (status cycling, Touch) pass no base
        // and must not be blocked by one.
        let tmp = TempDir::new("guard_absent");
        let project_path = tmp.path().to_string_lossy().to_string();
        let bean = seed_body_bean(&project_path, "Base body.");

        let updated = update_bean(
            project_path,
            bean.id.clone(),
            None,
            Some("in-progress".to_string()),
            None, None, None, None, None, None,
            None,
        )
        .expect("a status-only write needs no base");

        assert_eq!(updated.status, "in-progress");
        assert_eq!(updated.body.trim(), "Base body.", "body must be untouched");
    }

    #[test]
    fn test_guard_tolerates_trailing_newline_differences() {
        require_beans!();
        // `beans` normalises the trailing newline on a body, so a base captured
        // from a parsed bean can differ from what is written back by exactly
        // that. Treating it as a conflict would refuse every second save.
        let tmp = TempDir::new("guard_trailing");
        let project_path = tmp.path().to_string_lossy().to_string();
        let bean = seed_body_bean(&project_path, "Base body.");

        let updated = update_bean(
            project_path,
            bean.id.clone(),
            None, None, None,
            Some("Edited.".to_string()),
            None, None, None, None,
            Some("Base body.\n\n".to_string()),
        )
        .expect("a trailing-newline difference must not be a conflict");

        assert_eq!(updated.body.trim(), "Edited.");
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
        #[cfg(target_os = "macos")]
        let expected = EditorChoice::AppChain(vec![
            "Neovide".to_string(),
            "Visual Studio Code".to_string(),
            "TextEdit".to_string(),
        ]);
        // Elsewhere the chain is executables, ending at the xdg-open catch-all.
        #[cfg(not(target_os = "macos"))]
        let expected = EditorChoice::AppChain(vec![
            "neovide".to_string(),
            "code".to_string(),
            "gnome-text-editor".to_string(),
            "gedit".to_string(),
            "xdg-open".to_string(),
        ]);
        assert_eq!(resolve_editor_choice(None), expected);
        assert_eq!(resolve_editor_choice(Some("   ".to_string())), expected);
    }

    #[test]
    fn test_augmented_path_includes_extra_dirs() {
        // The augmented PATH always contains the platform's extra editor dirs
        // so a GUI app (whose inherited PATH omits them) can still find CLI
        // editors: Homebrew on macOS, /usr/local/bin elsewhere.
        let path = augmented_path();
        let dirs: Vec<&str> = path.split(':').collect();
        #[cfg(target_os = "macos")]
        assert!(dirs.contains(&"/opt/homebrew/bin"), "got {path}");
        #[cfg(not(target_os = "macos"))]
        assert!(dirs.contains(&"/usr/local/bin"), "got {path}");
    }

    #[test]
    fn test_extra_path_dirs_are_absolute_and_non_empty() {
        let extras = extra_path_dirs();
        assert!(!extras.is_empty());
        assert!(extras.iter().all(|d| d.starts_with('/')), "got {extras:?}");
    }

    #[test]
    fn test_open_with_app_unavailable_app_errors_without_launching() {
        // Every platform must report an unavailable app as an error rather than
        // launching something, so open_bean_in_editor can fall through to the
        // next candidate in the chain.
        let err = open_with_app("definitely-not-a-real-editor-xyz", "/tmp/beanstalk-no-such-file.md")
            .expect_err("unavailable app should not launch");
        assert!(err.contains("definitely-not-a-real-editor-xyz"), "got {err}");
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
        // macOS can still find the matching application via `open -a <name>`.
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
        require_beans!();
        let tmp = TempDir::new("search_title");

        let result = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Unique Title Query".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None);
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
        require_beans!();
        let tmp = TempDir::new("search_case");

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "lowercase title here".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
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
        require_beans!();
        let tmp = TempDir::new("search_status");

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Open Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create open bean");

        // Small sleep to ensure different random suffix.
        std::thread::sleep(std::time::Duration::from_millis(5));

        create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Done Bean".to_string(),
            "completed".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create done bean");

        // Filter to only "done" status.
        let result = search_beans(
            tmp.path().to_string_lossy().to_string(),
            "".to_string(),
            Some("completed".to_string()),
            None,
            None,
        );

        assert!(result.is_ok());
        let beans = result.unwrap();
        assert_eq!(beans.len(), 1, "status filter should return only completed beans");
        assert_eq!(beans[0].status, "completed");
    }

    // ── beanstalk-ulq3: update_bean / update_bean_status tests ───────────────

    #[test]
    fn test_update_bean_status() {
        require_beans!();
        let tmp = TempDir::new("update_status");

        let bean = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Status Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create bean");

        let result = update_bean_status(
            tmp.path().to_string_lossy().to_string(),
            bean.id.clone(),
            "completed".to_string(),
        );

        assert!(result.is_ok(), "update_bean_status should succeed: {:?}", result);
        let updated = result.unwrap();
        assert_eq!(updated.status, "completed", "status should be updated");

        // Verify the file on disk was updated.
        let file_content = fs::read_to_string(&updated.file_path).expect("read file");
        assert!(file_content.contains("status: completed"), "file on disk should reflect new status");
    }

    #[test]
    fn test_update_bean_title() {
        require_beans!();
        let tmp = TempDir::new("update_title");

        let bean = create_bean(
            tmp.path().to_string_lossy().to_string(),
            "Original Title".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
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
        // Quoting style belongs to `beans`; assert the value, not the syntax.
        assert!(file_content.contains("Updated Title"), "file should contain the new title");
    }

    #[test]
    fn test_update_bean_not_found() {
        require_beans!();
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
        require_beans!();
        // Regression for beanstalk-du57: removing a parent via UI edit must persist.
        // Frontend sends "" to mean "clear"; backend must drop the parent field.
        let tmp = TempDir::new("update_clear_parent");
        let project_path = tmp.path().to_string_lossy().to_string();

        // `beans` validates that a parent exists -- the old template writer did
        // not -- so the parent has to be real.
        let parent = create_bean(
            project_path.clone(),
            "Parent Bean".to_string(),
            "todo".to_string(),
            "epic".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("parent should be creatable");

        let bean = create_bean(
            project_path.clone(),
            "Child Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            Some(parent.id.clone()),
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create_bean should succeed");
        assert_eq!(bean.parent.as_deref(), Some(parent.id.as_str()));

        let updated = update_bean(
            project_path.clone(),
            bean.id.clone(),
            None,
            None,
            None,
            None,
            Some("".to_string()),
            None,
            None,
            None,
            None,
        )
        .expect("update_bean should succeed");

        assert!(updated.parent.is_none(), "empty-string parent should clear it");
        let on_disk = fs::read_to_string(&updated.file_path).expect("read file");
        assert!(!on_disk.contains("parent:"), "parent line should be absent from file");
    }


    // ── title round-trip tests ────────────────────────────────────────────────

    #[test]
    fn test_create_bean_title_with_special_chars_roundtrips() {
        require_beans!();
        // A title with '#' and '[' should survive a create → parse round-trip.
        let tmp = TempDir::new("title_special_create");
        let project_path = tmp.path().to_string_lossy().to_string();

        let tricky_title = "[Bug] Fix #42: edge case";
        let bean = create_bean(
            project_path.clone(),
            tricky_title.to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create_bean should succeed");

        assert_eq!(bean.title, tricky_title, "title must survive create round-trip");

        // Re-read from disk to confirm the file on disk is also correct.
        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find created bean");
        assert_eq!(on_disk.title, tricky_title, "title on disk must match original");
    }

    #[test]
    fn test_update_bean_title_with_special_chars_roundtrips() {
        require_beans!();
        // A title with YAML-special characters should survive an update → parse round-trip.
        let tmp = TempDir::new("title_special_update");
        let project_path = tmp.path().to_string_lossy().to_string();

        let original_title = "Original Title";
        let tricky_title = "#1: fix [critical] issue \"urgent\"";

        let bean = create_bean(
            project_path.clone(),
            original_title.to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
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
        require_beans!();
        // update_bean_status (None title) must preserve a title with special chars.
        let tmp = TempDir::new("status_preserves_title");
        let project_path = tmp.path().to_string_lossy().to_string();

        let tricky_title = "[Bug] status change clears title #99";

        let bean = create_bean(
            project_path.clone(),
            tricky_title.to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
        .expect("create_bean should succeed");

        let updated = update_bean_status(
            project_path.clone(),
            bean.id.clone(),
            "completed".to_string(),
        )
        .expect("update_bean_status should succeed");

        assert_eq!(updated.status, "completed", "status must be updated");
        assert_eq!(updated.title, tricky_title, "title must be preserved after status change");

        let on_disk = get_bean(project_path, bean.id).expect("get_bean should find updated bean");
        assert_eq!(on_disk.title, tricky_title, "title on disk must be preserved");
        assert_eq!(on_disk.status, "completed", "status on disk must be updated");
    }

    // ── priority round-trip tests (beanstalk-xgaq fix) ───────────────────────

    #[test]
    fn test_create_bean_with_priority_roundtrips() {
        require_beans!();
        // A priority value passed to create_bean should appear in the written file
        // and be returned in the Bean struct (round-trip).
        let tmp = TempDir::new("create_priority");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "Priority Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            Some("high".to_string()),
            Some("".to_string()),
            None,
            None)
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
        require_beans!();
        // When priority is None, the frontmatter must not contain a priority line.
        let tmp = TempDir::new("create_no_priority");
        let project_path = tmp.path().to_string_lossy().to_string();

        let bean = create_bean(
            project_path.clone(),
            "No Priority Bean".to_string(),
            "todo".to_string(),
            "task".to_string(),
            None,
            Some(vec![]),
            None,
            Some("".to_string()),
            None,
            None)
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
