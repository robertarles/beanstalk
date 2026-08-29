// Scripts module: discovery and execution of user-provided bean action scripts.
//
// A "bean script" is any executable file in one of two directories:
//
//   * global  — `config.scripts_dir`, defaulting to `<config_dir>/Beanstalk/scripts`
//   * project — `<project_path>/.beanstalk/scripts`
//
// Scripts declare themselves to the menu with comment headers in their first
// few lines (see `parse_metadata`). Language is irrelevant — the shebang and
// the executable bit are the whole contract:
//
//     #!/usr/bin/env bash
//     # beanstalk-name: Open Jira issue
//     # beanstalk-description: Opens the linked Jira ticket in a browser
//     # beanstalk-key: J
//     # beanstalk-timeout: 30
//
// A file without a `beanstalk-name` header is not a bean script and is skipped
// silently, so READMEs and helper libraries can live alongside the scripts.

use std::collections::BTreeMap;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

pub mod commands;

/// Number of leading lines scanned for `beanstalk-*` headers. Metadata is
/// parsed rather than obtained by running the script with a `--describe` flag:
/// building the menu must not execute anything.
const HEADER_SCAN_LINES: usize = 20;

/// Default wall-clock limit for a script, overridable per script with
/// `# beanstalk-timeout: <seconds>`.
const DEFAULT_TIMEOUT_SECS: u64 = 30;

/// Upper bound on a script-declared timeout, so a typo cannot hang the UI
/// indefinitely.
const MAX_TIMEOUT_SECS: u64 = 600;

/// Project-relative directory holding a repo's own action scripts.
const PROJECT_SCRIPTS_SUBDIR: &str = ".beanstalk/scripts";

// ── Data models ──────────────────────────────────────────────────────────────

/// Where a script was discovered. Project scripts shadow global scripts that
/// share a filename.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScriptScope {
    Global,
    Project,
}

/// A discovered, runnable bean script.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BeanScript {
    /// Filename, e.g. `jira.sh`. This is the shadowing key and the identifier
    /// the frontend passes back to run the script — not the display name,
    /// which can change without breaking anything.
    pub id: String,
    /// Menu label, from `beanstalk-name`.
    pub name: String,
    /// Menu subtitle, from `beanstalk-description`.
    pub description: Option<String>,
    /// Optional single-character accelerator, from `beanstalk-key`.
    pub key: Option<String>,
    pub path: String,
    pub scope: ScriptScope,
    pub timeout_secs: u64,
}

/// The result of running a script, surfaced to the user as a toast.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScriptOutput {
    pub script_id: String,
    pub name: String,
    pub success: bool,
    /// `None` when the script was killed by a signal or by the timeout.
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
}

/// Header metadata parsed out of a script file.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ScriptMetadata {
    pub name: Option<String>,
    pub description: Option<String>,
    pub key: Option<String>,
    pub timeout_secs: Option<u64>,
}

// ── Metadata parsing ─────────────────────────────────────────────────────────

/// Strip a leading comment marker from a line, returning the remaining text.
///
/// Both `#` (shell, Python, Ruby, Perl) and `//` (JavaScript, Deno, Go) are
/// accepted so the contract is not tied to one language's comment syntax.
fn strip_comment_prefix(line: &str) -> Option<&str> {
    let trimmed = line.trim_start();
    if let Some(rest) = trimmed.strip_prefix("//") {
        Some(rest)
    } else {
        // A shebang is a `#` line but never a header; skip it explicitly so it
        // does not consume one of the scanned lines' worth of attention.
        trimmed
            .strip_prefix('#')
            .filter(|rest| !rest.starts_with('!'))
    }
}

/// Parse `beanstalk-<field>: <value>` headers from the head of a script.
///
/// Scanning stops after `HEADER_SCAN_LINES` lines. Unknown `beanstalk-*` keys
/// are ignored rather than treated as errors, so older Beanstalk versions stay
/// forward-compatible with scripts written for newer ones.
pub fn parse_metadata(content: &str) -> ScriptMetadata {
    let mut meta = ScriptMetadata::default();

    for line in content.lines().take(HEADER_SCAN_LINES) {
        let Some(rest) = strip_comment_prefix(line) else {
            continue;
        };
        let rest = rest.trim();
        let Some((raw_key, raw_value)) = rest.split_once(':') else {
            continue;
        };
        // Lowercase before stripping, so `BEANSTALK-NAME` matches too.
        let key = raw_key.trim().to_ascii_lowercase();
        let Some(field) = key.strip_prefix("beanstalk-") else {
            continue;
        };
        let value = raw_value.trim();
        if value.is_empty() {
            continue;
        }

        match field.trim() {
            "name" => meta.name = Some(value.to_string()),
            "description" | "desc" => meta.description = Some(value.to_string()),
            // Accelerators are single characters; a longer value is a mistake
            // and is dropped rather than silently truncated.
            "key" if value.chars().count() == 1 => meta.key = Some(value.to_string()),
            "timeout" => {
                meta.timeout_secs = value.parse::<u64>().ok().map(|s| s.clamp(1, MAX_TIMEOUT_SECS))
            }
            _ => {}
        }
    }

    meta
}

/// Read only the head of a file, so a large binary in the scripts directory is
/// not slurped into memory just to discover it has no headers.
fn read_head(path: &Path) -> Option<String> {
    let file = std::fs::File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let mut head = String::new();

    for _ in 0..HEADER_SCAN_LINES {
        let mut line = String::new();
        // A read error here means the file is not UTF-8 text (a compiled
        // binary, say). Those cannot carry headers, so stop and return what
        // was read — which will simply fail the `name` check.
        match reader.read_line(&mut line) {
            Ok(0) | Err(_) => break,
            Ok(_) => head.push_str(&line),
        }
    }

    Some(head)
}

// ── Discovery ────────────────────────────────────────────────────────────────

/// Whether `path` is a file the OS will actually execute.
///
/// The executable bit is the opt-in: a script is not offered in the menu until
/// the user has run `chmod +x` on it.
#[cfg(unix)]
fn is_executable(path: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    path.metadata()
        .map(|m| m.is_file() && m.permissions().mode() & 0o111 != 0)
        .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable(path: &Path) -> bool {
    path.is_file()
}

/// The global scripts directory: `config.scripts_dir` when set, otherwise
/// `<config_dir>/Beanstalk/scripts` (alongside `config.json`).
pub fn global_scripts_dir(configured: Option<&str>) -> Option<PathBuf> {
    if let Some(dir) = configured.map(str::trim).filter(|d| !d.is_empty()) {
        return Some(PathBuf::from(expand_tilde(dir)));
    }
    dirs::config_dir().map(|base| base.join("Beanstalk").join("scripts"))
}

/// Expand a leading `~` so a hand-edited `config.json` can use `~/...` paths.
fn expand_tilde(path: &str) -> String {
    let Some(rest) = path.strip_prefix('~') else {
        return path.to_string();
    };
    let Some(home) = dirs::home_dir() else {
        return path.to_string();
    };
    // `~` alone, or `~/...`; a `~user` form is not supported and is left as-is.
    match rest {
        "" => home.to_string_lossy().into_owned(),
        r if r.starts_with('/') => home.join(r.trim_start_matches('/')).to_string_lossy().into_owned(),
        _ => path.to_string(),
    }
}

/// The project-local scripts directory for `project_path`.
pub fn project_scripts_dir(project_path: &str) -> PathBuf {
    Path::new(project_path).join(PROJECT_SCRIPTS_SUBDIR)
}

/// Collect the runnable scripts in a single directory, keyed by filename.
///
/// A missing directory is not an error — neither scripts directory is required
/// to exist.
fn scan_dir(dir: &Path, scope: ScriptScope) -> BTreeMap<String, BeanScript> {
    let mut found = BTreeMap::new();

    let Ok(entries) = std::fs::read_dir(dir) else {
        return found;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !is_executable(&path) {
            continue;
        }
        let Some(id) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        let Some(head) = read_head(&path) else {
            continue;
        };
        let meta = parse_metadata(&head);
        // No declared name → not a bean script. This is what lets helper
        // scripts and non-menu executables share the directory.
        let Some(name) = meta.name else {
            continue;
        };

        found.insert(
            id.to_string(),
            BeanScript {
                id: id.to_string(),
                name,
                description: meta.description,
                key: meta.key,
                path: path.to_string_lossy().into_owned(),
                scope,
                timeout_secs: meta.timeout_secs.unwrap_or(DEFAULT_TIMEOUT_SECS),
            },
        );
    }

    found
}

/// Discover every script available for `project_path`, global and local.
///
/// Shadowing is by **filename**, not display name: a project's `jira.sh`
/// replaces the global `jira.sh` outright, the same way an earlier `PATH`
/// entry shadows a later one. Matching on display name instead would let a
/// typo either duplicate an entry or silently hide an unrelated script.
///
/// Results are sorted by display name for a stable menu order.
pub fn discover_scripts(project_path: &str, configured_global: Option<&str>) -> Vec<BeanScript> {
    let mut merged = match global_scripts_dir(configured_global) {
        Some(dir) => scan_dir(&dir, ScriptScope::Global),
        None => BTreeMap::new(),
    };

    // Project entries overwrite same-filename global entries.
    merged.extend(scan_dir(&project_scripts_dir(project_path), ScriptScope::Project));

    let mut scripts: Vec<BeanScript> = merged.into_values().collect();
    scripts.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()).then(a.id.cmp(&b.id)));
    scripts
}

// ── Execution ────────────────────────────────────────────────────────────────

/// Build the environment handed to a script.
///
/// Every scalar bean field gets a `BEAN_*` variable so the common case is a
/// two-line shell script. Absent optional fields are passed as empty strings
/// rather than being omitted, so `$BEAN_ASSIGNEE` never expands to a stale
/// value inherited from the parent environment.
fn script_env(bean: &crate::beans::Bean, project_path: &str) -> Vec<(String, String)> {
    let opt = |v: &Option<String>| v.clone().unwrap_or_default();

    vec![
        ("BEAN_ID".into(), bean.id.clone()),
        ("BEAN_TITLE".into(), bean.title.clone()),
        ("BEAN_STATUS".into(), bean.status.clone()),
        ("BEAN_TYPE".into(), bean.bean_type.clone()),
        ("BEAN_PARENT".into(), opt(&bean.parent)),
        ("BEAN_PRIORITY".into(), opt(&bean.priority)),
        ("BEAN_ASSIGNEE".into(), opt(&bean.assignee)),
        ("BEAN_CREATED_AT".into(), opt(&bean.created_at)),
        ("BEAN_UPDATED_AT".into(), opt(&bean.updated_at)),
        ("BEAN_TAGS".into(), bean.tags.join(",")),
        ("BEAN_BLOCKING".into(), bean.blocking.join(",")),
        ("BEAN_BLOCKED_BY".into(), bean.blocked_by.join(",")),
        ("BEAN_FILE".into(), bean.file_path.clone()),
        ("BEANSTALK_PROJECT_PATH".into(), project_path.to_string()),
        (
            "BEANSTALK_BEANS_DIR".into(),
            Path::new(project_path).join(".beans").to_string_lossy().into_owned(),
        ),
        ("BEANSTALK_VERSION".into(), env!("CARGO_PKG_VERSION").to_string()),
    ]
}

/// Run `script` against `bean` and collect its output.
///
/// The script receives the bean three ways, in increasing order of detail:
///   * `argv[1]` — the bean's file path, for one-liner scripts
///   * `BEAN_*` environment variables — every scalar field
///   * the full `Bean` as JSON on stdin — including `body` and `children`,
///     which is what keeps the contract stable as the model grows
///
/// stdin and both output streams are pumped on their own threads. Writing the
/// JSON inline would deadlock as soon as a bean body exceeded the pipe buffer
/// and the script had not yet started reading.
pub fn run_script(
    script: &BeanScript,
    bean: &crate::beans::Bean,
    project_path: &str,
) -> Result<ScriptOutput, String> {
    let payload = serde_json::to_string(bean)
        .map_err(|e| format!("Failed to serialize bean for script: {e}"))?;

    let mut child = Command::new(&script.path)
        .arg(&bean.file_path)
        .current_dir(project_path)
        // A `.app` launched from Finder does not inherit the login shell's
        // PATH, so Homebrew-installed tools would not resolve. Same fix the
        // editor launcher needs.
        .env("PATH", crate::commands::augmented_path())
        .envs(script_env(bean, project_path))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to launch script '{}': {e}", script.name))?;

    // Pump stdin on its own thread; a script that ignores stdin just gets a
    // broken pipe, which is not an error worth surfacing.
    if let Some(mut stdin) = child.stdin.take() {
        std::thread::spawn(move || {
            let _ = stdin.write_all(payload.as_bytes());
        });
    }

    let stdout_handle = child.stdout.take().map(|mut out| {
        std::thread::spawn(move || {
            let mut buf = Vec::new();
            let _ = std::io::copy(&mut out, &mut buf);
            String::from_utf8_lossy(&buf).into_owned()
        })
    });
    let stderr_handle = child.stderr.take().map(|mut err| {
        std::thread::spawn(move || {
            let mut buf = Vec::new();
            let _ = std::io::copy(&mut err, &mut buf);
            String::from_utf8_lossy(&buf).into_owned()
        })
    });

    let deadline = Instant::now() + Duration::from_secs(script.timeout_secs);
    let mut timed_out = false;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) => {
                if Instant::now() >= deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    timed_out = true;
                    break None;
                }
                std::thread::sleep(Duration::from_millis(25));
            }
            Err(e) => return Err(format!("Failed to wait on script '{}': {e}", script.name)),
        }
    };

    let join = |h: Option<std::thread::JoinHandle<String>>| {
        h.and_then(|h| h.join().ok()).unwrap_or_default()
    };

    Ok(ScriptOutput {
        script_id: script.id.clone(),
        name: script.name.clone(),
        success: status.map(|s| s.success()).unwrap_or(false),
        exit_code: status.and_then(|s| s.code()),
        stdout: join(stdout_handle),
        stderr: join(stderr_handle),
        timed_out,
    })
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    static COUNTER: AtomicU32 = AtomicU32::new(0);

    /// Temporary directory removed when the guard is dropped. Mirrors the
    /// helper in `commands.rs`; kept local so the two modules' tests stay
    /// independent.
    struct TempDir {
        path: PathBuf,
    }

    impl TempDir {
        fn new(suffix: &str) -> Self {
            let path = std::env::temp_dir().join(format!(
                "beanstalk_scripts_test_{}_{}_{}",
                suffix,
                std::process::id(),
                COUNTER.fetch_add(1, Ordering::SeqCst)
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

    /// Write an executable script into `dir`.
    fn write_script(dir: &Path, name: &str, body: &str) -> PathBuf {
        fs::create_dir_all(dir).expect("create script dir");
        let path = dir.join(name);
        fs::write(&path, body).expect("write script");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).expect("chmod");
        }
        path
    }

    fn sample_bean(file_path: &str) -> crate::beans::Bean {
        crate::beans::Bean {
            id: "beanstalk-a1b2".into(),
            title: "Fix the thing".into(),
            status: "in-progress".into(),
            bean_type: "bug".into(),
            parent: Some("beanstalk-root".into()),
            tags: vec!["ui".into(), "urgent".into()],
            priority: Some("high".into()),
            assignee: None,
            created_at: Some("2026-01-01T00:00:00Z".into()),
            updated_at: None,
            body: "The body".into(),
            file_path: file_path.into(),
            children: vec![],
            blocking: vec!["beanstalk-zzzz".into()],
            blocked_by: vec![],
        }
    }

    // ── parse_metadata ───────────────────────────────────────────────────────

    #[test]
    fn parses_hash_headers() {
        let meta = parse_metadata(
            "#!/usr/bin/env bash\n# beanstalk-name: Open Jira\n# beanstalk-description: Opens it\n",
        );
        assert_eq!(meta.name.as_deref(), Some("Open Jira"));
        assert_eq!(meta.description.as_deref(), Some("Opens it"));
    }

    #[test]
    fn parses_slash_headers() {
        let meta = parse_metadata("#!/usr/bin/env node\n// beanstalk-name: Node action\n");
        assert_eq!(meta.name.as_deref(), Some("Node action"));
    }

    #[test]
    fn header_matching_is_case_insensitive_and_accepts_desc_alias() {
        let meta = parse_metadata("# BEANSTALK-NAME: Shouty\n# beanstalk-desc: Short form\n");
        assert_eq!(meta.name.as_deref(), Some("Shouty"));
        assert_eq!(meta.description.as_deref(), Some("Short form"));
    }

    #[test]
    fn shebang_is_not_treated_as_a_header() {
        // A shebang starts with `#` but must never be parsed as metadata.
        let meta = parse_metadata("#!/usr/bin/env bash\n");
        assert_eq!(meta, ScriptMetadata::default());
    }

    #[test]
    fn multi_character_accelerator_is_rejected() {
        let meta = parse_metadata("# beanstalk-name: X\n# beanstalk-key: ctrl-j\n");
        assert_eq!(meta.key, None);
    }

    #[test]
    fn single_character_accelerator_is_kept() {
        let meta = parse_metadata("# beanstalk-name: X\n# beanstalk-key: J\n");
        assert_eq!(meta.key.as_deref(), Some("J"));
    }

    #[test]
    fn timeout_is_parsed_and_clamped() {
        assert_eq!(parse_metadata("# beanstalk-timeout: 45\n").timeout_secs, Some(45));
        assert_eq!(
            parse_metadata("# beanstalk-timeout: 99999\n").timeout_secs,
            Some(MAX_TIMEOUT_SECS)
        );
        assert_eq!(parse_metadata("# beanstalk-timeout: 0\n").timeout_secs, Some(1));
        assert_eq!(parse_metadata("# beanstalk-timeout: soon\n").timeout_secs, None);
    }

    #[test]
    fn empty_values_and_unknown_fields_are_ignored() {
        let meta = parse_metadata("# beanstalk-name:\n# beanstalk-future: whatever\n");
        assert_eq!(meta, ScriptMetadata::default());
    }

    #[test]
    fn headers_past_the_scan_window_are_ignored() {
        let mut src = String::from("#!/bin/sh\n");
        for _ in 0..HEADER_SCAN_LINES {
            src.push_str("# filler\n");
        }
        src.push_str("# beanstalk-name: Too late\n");
        assert_eq!(parse_metadata(&src).name, None);
    }

    #[test]
    fn non_comment_lines_are_skipped() {
        let meta = parse_metadata("echo hi\n# beanstalk-name: After code\n");
        assert_eq!(meta.name.as_deref(), Some("After code"));
    }

    // ── expand_tilde ─────────────────────────────────────────────────────────

    #[test]
    fn expands_leading_tilde() {
        let home = dirs::home_dir().expect("home dir");
        assert_eq!(expand_tilde("~/scripts"), home.join("scripts").to_string_lossy());
        assert_eq!(expand_tilde("~"), home.to_string_lossy());
        // Absolute and `~user` forms pass through untouched.
        assert_eq!(expand_tilde("/tmp/x"), "/tmp/x");
        assert_eq!(expand_tilde("~bob/x"), "~bob/x");
    }

    #[test]
    fn configured_global_dir_overrides_default() {
        let dir = global_scripts_dir(Some("/custom/scripts")).expect("dir");
        assert_eq!(dir, PathBuf::from("/custom/scripts"));
        // Blank is treated as unset so an empty config value is not a broken path.
        assert_ne!(global_scripts_dir(Some("   ")), Some(PathBuf::from("   ")));
    }

    #[test]
    fn project_dir_is_under_dot_beanstalk() {
        assert_eq!(
            project_scripts_dir("/proj"),
            PathBuf::from("/proj/.beanstalk/scripts")
        );
    }

    // ── Discovery ────────────────────────────────────────────────────────────

    #[test]
    fn missing_directories_yield_no_scripts() {
        let tmp = TempDir::new("missing");
        let scripts = discover_scripts(
            tmp.path().to_str().unwrap(),
            Some(tmp.path().join("nope").to_str().unwrap()),
        );
        assert!(scripts.is_empty());
    }

    #[test]
    fn only_named_executables_are_listed() {
        let tmp = TempDir::new("named");
        let global = tmp.path().join("global");
        write_script(&global, "good.sh", "#!/bin/sh\n# beanstalk-name: Good\n");
        // Executable but undeclared — a helper script, not a menu entry.
        write_script(&global, "helper.sh", "#!/bin/sh\necho helper\n");
        // Declared but not executable — the chmod is the opt-in.
        fs::write(global.join("README.md"), "# beanstalk-name: Nope\n").unwrap();

        let scripts = discover_scripts(tmp.path().to_str().unwrap(), global.to_str());
        assert_eq!(scripts.len(), 1);
        assert_eq!(scripts[0].name, "Good");
        assert_eq!(scripts[0].id, "good.sh");
        assert_eq!(scripts[0].scope, ScriptScope::Global);
        assert_eq!(scripts[0].timeout_secs, DEFAULT_TIMEOUT_SECS);
    }

    #[test]
    fn project_script_shadows_global_by_filename() {
        let tmp = TempDir::new("shadow");
        let global = tmp.path().join("global");
        let project = tmp.path().join("proj");

        write_script(&global, "jira.sh", "#!/bin/sh\n# beanstalk-name: Global Jira\n");
        write_script(&global, "only-global.sh", "#!/bin/sh\n# beanstalk-name: Global Only\n");
        write_script(
            &project.join(".beanstalk/scripts"),
            "jira.sh",
            "#!/bin/sh\n# beanstalk-name: Project Jira\n",
        );

        let scripts = discover_scripts(project.to_str().unwrap(), global.to_str());
        assert_eq!(scripts.len(), 2, "shadowed script must not appear twice");

        let jira = scripts.iter().find(|s| s.id == "jira.sh").expect("jira.sh");
        assert_eq!(jira.name, "Project Jira");
        assert_eq!(jira.scope, ScriptScope::Project);

        let other = scripts.iter().find(|s| s.id == "only-global.sh").unwrap();
        assert_eq!(other.scope, ScriptScope::Global);
    }

    #[test]
    fn shadowing_is_by_filename_not_display_name() {
        // Same display name, different filenames → both are listed. Matching on
        // the label would wrongly collapse these into one entry.
        let tmp = TempDir::new("bydisplay");
        let global = tmp.path().join("global");
        let project = tmp.path().join("proj");
        write_script(&global, "a.sh", "#!/bin/sh\n# beanstalk-name: Same Label\n");
        write_script(
            &project.join(".beanstalk/scripts"),
            "b.sh",
            "#!/bin/sh\n# beanstalk-name: Same Label\n",
        );

        let scripts = discover_scripts(project.to_str().unwrap(), global.to_str());
        assert_eq!(scripts.len(), 2);
    }

    #[test]
    fn results_are_sorted_by_display_name() {
        let tmp = TempDir::new("sorted");
        let global = tmp.path().join("global");
        write_script(&global, "z.sh", "#!/bin/sh\n# beanstalk-name: alpha\n");
        write_script(&global, "a.sh", "#!/bin/sh\n# beanstalk-name: Zulu\n");

        let scripts = discover_scripts(tmp.path().to_str().unwrap(), global.to_str());
        assert_eq!(
            scripts.iter().map(|s| s.name.as_str()).collect::<Vec<_>>(),
            vec!["alpha", "Zulu"]
        );
    }

    // ── Execution ────────────────────────────────────────────────────────────

    #[cfg(unix)]
    fn run_fixture(tmp: &TempDir, body: &str) -> ScriptOutput {
        let global = tmp.path().join("global");
        write_script(&global, "run.sh", body);
        let scripts = discover_scripts(tmp.path().to_str().unwrap(), global.to_str());
        let script = scripts.first().expect("script discovered");
        let bean_file = tmp.path().join("bean.md");
        fs::write(&bean_file, "---\n---\n").unwrap();
        let bean = sample_bean(bean_file.to_str().unwrap());
        run_script(script, &bean, tmp.path().to_str().unwrap()).expect("run")
    }

    #[cfg(unix)]
    #[test]
    fn script_receives_file_path_as_first_argument() {
        let tmp = TempDir::new("argv");
        let out = run_fixture(&tmp, "#!/bin/sh\n# beanstalk-name: Argv\necho \"$1\"\n");
        assert!(out.success);
        assert!(out.stdout.trim().ends_with("bean.md"), "got {:?}", out.stdout);
    }

    #[cfg(unix)]
    #[test]
    fn script_receives_bean_fields_as_env_vars() {
        let tmp = TempDir::new("env");
        let out = run_fixture(
            &tmp,
            "#!/bin/sh\n# beanstalk-name: Env\necho \"$BEAN_ID|$BEAN_TITLE|$BEAN_STATUS|$BEAN_TAGS|$BEAN_PRIORITY\"\n",
        );
        assert!(out.success);
        assert_eq!(
            out.stdout.trim(),
            "beanstalk-a1b2|Fix the thing|in-progress|ui,urgent|high"
        );
    }

    #[cfg(unix)]
    #[test]
    fn absent_optional_fields_become_empty_strings() {
        // `assignee` is None; the script must see "" rather than an inherited value.
        let tmp = TempDir::new("emptyenv");
        let out = run_fixture(
            &tmp,
            "#!/bin/sh\n# beanstalk-name: Empty\necho \"[$BEAN_ASSIGNEE][$BEAN_UPDATED_AT]\"\n",
        );
        assert_eq!(out.stdout.trim(), "[][]");
    }

    #[cfg(unix)]
    #[test]
    fn script_receives_full_bean_json_on_stdin() {
        let tmp = TempDir::new("stdin");
        let out = run_fixture(&tmp, "#!/bin/sh\n# beanstalk-name: Stdin\ncat\n");
        assert!(out.success);
        let parsed: serde_json::Value = serde_json::from_str(out.stdout.trim()).expect("valid json");
        assert_eq!(parsed["id"], "beanstalk-a1b2");
        // The body is only reachable via stdin — that is the point of the channel.
        assert_eq!(parsed["body"], "The body");
    }

    #[cfg(unix)]
    #[test]
    fn script_that_ignores_stdin_still_succeeds() {
        // Not reading stdin gives the writer thread a broken pipe, which must
        // not be reported as a failure.
        let tmp = TempDir::new("nostdin");
        let out = run_fixture(&tmp, "#!/bin/sh\n# beanstalk-name: Ignore\necho done\n");
        assert!(out.success);
        assert_eq!(out.stdout.trim(), "done");
    }

    #[cfg(unix)]
    #[test]
    fn nonzero_exit_is_reported_with_stderr() {
        let tmp = TempDir::new("fail");
        let out = run_fixture(
            &tmp,
            "#!/bin/sh\n# beanstalk-name: Fail\necho 'went wrong' >&2\nexit 3\n",
        );
        assert!(!out.success);
        assert_eq!(out.exit_code, Some(3));
        assert_eq!(out.stderr.trim(), "went wrong");
        assert!(!out.timed_out);
    }

    #[cfg(unix)]
    #[test]
    fn runaway_script_is_killed_at_its_timeout() {
        let tmp = TempDir::new("timeout");
        let out = run_fixture(
            &tmp,
            "#!/bin/sh\n# beanstalk-name: Sleepy\n# beanstalk-timeout: 1\nsleep 30\n",
        );
        assert!(out.timed_out);
        assert!(!out.success);
    }

    #[cfg(unix)]
    #[test]
    fn script_runs_with_the_project_as_working_directory() {
        let tmp = TempDir::new("cwd");
        let out = run_fixture(&tmp, "#!/bin/sh\n# beanstalk-name: Cwd\npwd\n");
        // macOS resolves /var → /private/var, so compare the trailing component.
        let expected = tmp.path().file_name().unwrap().to_string_lossy().into_owned();
        assert!(out.stdout.trim().ends_with(&expected), "got {:?}", out.stdout);
    }

    #[cfg(unix)]
    #[test]
    fn large_bean_body_does_not_deadlock() {
        // A body larger than the pipe buffer would hang if stdin were written
        // inline instead of on its own thread.
        let tmp = TempDir::new("bigbody");
        let global = tmp.path().join("global");
        write_script(&global, "run.sh", "#!/bin/sh\n# beanstalk-name: Big\nwc -c\n");
        let scripts = discover_scripts(tmp.path().to_str().unwrap(), global.to_str());
        let bean_file = tmp.path().join("bean.md");
        fs::write(&bean_file, "x").unwrap();
        let mut bean = sample_bean(bean_file.to_str().unwrap());
        bean.body = "y".repeat(512 * 1024);

        let out = run_script(&scripts[0], &bean, tmp.path().to_str().unwrap()).expect("run");
        assert!(out.success);
        assert!(out.stdout.trim().parse::<usize>().unwrap() > 512 * 1024);
    }
}


