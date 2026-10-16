// beanstalk-dg1m: delegate bean writes to the `beans` binary.
//
// Beanstalk reads bean files with its own parser but must never write them
// itself: the format belongs to `beans`, and every reimplementation drifts.
// `create_bean`/`update_bean` previously rebuilt files from a hardcoded
// template, which silently rewrote the id comment into an `id:` key, quoted
// titles the CLI leaves bare, and injected `tags: []`.
//
// Read liberally, write only through beans.

use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

/// Directories searched for `beans` when it is not on `PATH`.
///
/// A GUI process launched from a desktop entry often inherits a minimal `PATH`
/// that excludes the places a user-installed CLI actually lives, so looking only
/// at `PATH` would report the binary missing for someone who plainly has it.
const FALLBACK_DIRS: &[&str] = &[
    "~/.local/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/opt/homebrew/bin",
];

/// Whether the `beans` binary is usable, and where it was found.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BeansCliStatus {
    pub available: bool,
    /// Absolute path to the resolved binary.
    pub path: Option<String>,
    /// Version string from `beans version`, when it could be read.
    pub version: Option<String>,
    /// Why resolution failed, for display.
    pub error: Option<String>,
}

/// A failed `beans` invocation, in a shape the frontend can branch on.
///
/// `code` carries the CLI's own machine-readable code where there is one
/// (`CONFLICT`, `VALIDATION_ERROR`), so nothing has to sniff message text.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BeansCliError {
    pub code: String,
    pub message: String,
}

impl BeansCliError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        BeansCliError { code: code.to_string(), message: message.into() }
    }

    /// The binary could not be found. Writes are disabled; reads are unaffected,
    /// and the external editor stays available.
    pub fn unavailable() -> Self {
        BeansCliError::new(
            "BEANS_UNAVAILABLE",
            "The `beans` CLI was not found. Beanstalk writes bean files through \
             it, so editing is disabled. Install beans or set `beans_bin` in the \
             Beanstalk config. The external editor still works.",
        )
    }
}

impl std::fmt::Display for BeansCliError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

/// Expand a leading `~` against the home directory.
fn expand_tilde(path: &str) -> PathBuf {
    match path.strip_prefix('~') {
        Some(rest) => match dirs::home_dir() {
            Some(home) => home.join(rest.trim_start_matches('/')),
            None => PathBuf::from(path),
        },
        None => PathBuf::from(path),
    }
}

/// Locate the `beans` binary.
///
/// A configured path wins outright and is the escape hatch; otherwise `PATH` is
/// searched, then [`FALLBACK_DIRS`].
pub fn resolve_beans_bin(configured: Option<&str>) -> Option<PathBuf> {
    if let Some(raw) = configured {
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            let path = expand_tilde(trimmed);
            // A configured path is honoured even if it is not executable, so the
            // resulting error names what the user actually asked for.
            return Some(path);
        }
    }

    if let Some(dir) = std::env::var_os("PATH") {
        for entry in std::env::split_paths(&dir) {
            let candidate = entry.join("beans");
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }

    for dir in FALLBACK_DIRS {
        let candidate = expand_tilde(dir).join("beans");
        if candidate.is_file() {
            return Some(candidate);
        }
    }

    None
}

/// Report whether writes are possible, for the UI to gate editing on.
#[tauri::command]
pub fn beans_cli_status() -> BeansCliStatus {
    let configured = crate::config::load_config().beans_bin;
    let Some(path) = resolve_beans_bin(configured.as_deref()) else {
        return BeansCliStatus {
            available: false,
            path: None,
            version: None,
            error: Some("`beans` not found on PATH".to_string()),
        };
    };

    // `beans version` is the real check: it proves the binary runs, not merely
    // that a file of that name exists. Note it is a subcommand; `--version` is
    // not a flag beans accepts.
    match Command::new(&path).arg("version").output() {
        Ok(out) if out.status.success() => BeansCliStatus {
            available: true,
            path: Some(path.to_string_lossy().to_string()),
            version: Some(String::from_utf8_lossy(&out.stdout).trim().to_string()),
            error: None,
        },
        Ok(out) => BeansCliStatus {
            available: false,
            path: Some(path.to_string_lossy().to_string()),
            version: None,
            error: Some(format!(
                "`beans version` failed: {}",
                String::from_utf8_lossy(&out.stderr).trim()
            )),
        },
        Err(e) => BeansCliStatus {
            available: false,
            path: Some(path.to_string_lossy().to_string()),
            version: None,
            error: Some(format!("could not run `beans`: {e}")),
        },
    }
}

/// The JSON envelope every `beans --json` command returns on failure.
#[derive(Debug, Deserialize)]
struct FailureEnvelope {
    #[allow(dead_code)]
    success: bool,
    error: Option<String>,
    code: Option<String>,
}

/// Run `beans` against a project, optionally streaming a body on stdin.
///
/// Two separate things have to be pinned, and pinning only one is a trap:
///
/// - **Working directory** is set to the project so `beans` finds *that*
///   project's `.beans.yml`. Config is resolved by searching upward from the
///   cwd, so without this a created bean silently takes whatever `prefix` some
///   ancestor directory happens to declare. Measured: creating into a probe
///   directory from this repo's cwd minted a `beanstalk-` id instead of the
///   probe project's own prefix.
/// - **`--beans-path`** forces the data directory to where Beanstalk actually
///   reads from, which is always `<project>/.beans`. Beanstalk ignores the
///   `path:` key in `.beans.yml`, so honouring it here would write somewhere
///   the reader never looks.
///
/// `stdin_body` lets a body be streamed rather than passed in argv: it avoids
/// any escaping question, since `Command` does not involve a shell.
pub fn run_beans(
    project_path: &Path,
    args: &[String],
    stdin_body: Option<&str>,
) -> Result<String, BeansCliError> {
    let configured = crate::config::load_config().beans_bin;
    let bin = resolve_beans_bin(configured.as_deref()).ok_or_else(BeansCliError::unavailable)?;
    let beans_dir = project_path.join(".beans");

    let mut cmd = Command::new(&bin);
    cmd.current_dir(project_path)
        .arg("--beans-path")
        .arg(&beans_dir)
        .args(args)
        .arg("--json")
        .stdin(if stdin_body.is_some() { Stdio::piped() } else { Stdio::null() })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    log::debug!("run_beans: cd {:?}; {:?} --beans-path {:?} {:?} --json", project_path, bin, beans_dir, args);

    let mut child = cmd.spawn().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            BeansCliError::unavailable()
        } else {
            BeansCliError::new("SPAWN_FAILED", format!("could not run `beans`: {e}"))
        }
    })?;

    if let Some(body) = stdin_body {
        let mut pipe = child
            .stdin
            .take()
            .ok_or_else(|| BeansCliError::new("SPAWN_FAILED", "no stdin pipe"))?;
        pipe.write_all(body.as_bytes())
            .map_err(|e| BeansCliError::new("SPAWN_FAILED", format!("writing body: {e}")))?;
        // Dropping closes the pipe, which beans needs to see EOF on `-d -`.
        drop(pipe);
    }

    let out = child
        .wait_with_output()
        .map_err(|e| BeansCliError::new("SPAWN_FAILED", format!("waiting for `beans`: {e}")))?;

    let stdout = String::from_utf8_lossy(&out.stdout).to_string();

    if out.status.success() {
        return Ok(stdout);
    }

    // Prefer the CLI's own structured failure over its human-readable stderr.
    if let Ok(envelope) = serde_json::from_str::<FailureEnvelope>(&stdout) {
        return Err(BeansCliError::new(
            envelope.code.as_deref().unwrap_or("BEANS_FAILED"),
            envelope
                .error
                .unwrap_or_else(|| "beans reported a failure".to_string()),
        ));
    }

    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
    Err(BeansCliError::new(
        "BEANS_FAILED",
        if stderr.is_empty() { "beans failed with no output".to_string() } else { stderr },
    ))
}

/// Add/remove argument pairs turning `existing` into `desired`.
///
/// The CLI sets tags and relations incrementally (`--tag` / `--remove-tag`)
/// rather than accepting a whole list, so a "set" from the UI becomes a diff.
/// Add/remove is also commutative, which behaves better under concurrent edits
/// than replacing a list wholesale.
pub fn diff_list_args(add_flag: &str, remove_flag: &str, existing: &[String], desired: &[String]) -> Vec<String> {
    let mut args = Vec::new();
    for item in desired {
        if !existing.contains(item) {
            args.push(add_flag.to_string());
            args.push(item.clone());
        }
    }
    for item in existing {
        if !desired.contains(item) {
            args.push(remove_flag.to_string());
            args.push(item.clone());
        }
    }
    args
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn configured_path_wins_over_path_lookup() {
        let got = resolve_beans_bin(Some("/opt/custom/beans"));
        assert_eq!(got, Some(PathBuf::from("/opt/custom/beans")));
    }

    #[test]
    fn blank_configured_path_falls_through() {
        // An empty or whitespace config value must not shadow a real binary.
        assert_eq!(resolve_beans_bin(Some("   ")), resolve_beans_bin(None));
    }

    #[test]
    fn configured_path_expands_tilde() {
        let got = resolve_beans_bin(Some("~/bin/beans")).unwrap();
        assert!(got.is_absolute(), "expected an absolute path, got {got:?}");
        assert!(got.ends_with("bin/beans"));
    }

    #[test]
    fn unavailable_error_mentions_the_external_editor() {
        // The message is the user's only clue that editing is disabled but the
        // cowboy path still works, so it must say so.
        let err = BeansCliError::unavailable();
        assert_eq!(err.code, "BEANS_UNAVAILABLE");
        assert!(err.message.contains("external editor"));
    }

    #[test]
    fn diff_list_adds_only_what_is_new() {
        let args = diff_list_args("--tag", "--remove-tag", &["keep".into()], &["keep".into(), "new".into()]);
        assert_eq!(args, vec!["--tag", "new"]);
    }

    #[test]
    fn diff_list_removes_only_what_is_gone() {
        let args = diff_list_args("--tag", "--remove-tag", &["keep".into(), "drop".into()], &["keep".into()]);
        assert_eq!(args, vec!["--remove-tag", "drop"]);
    }

    #[test]
    fn diff_list_is_empty_when_unchanged() {
        let same: Vec<String> = vec!["a".into(), "b".into()];
        assert!(diff_list_args("--tag", "--remove-tag", &same, &same).is_empty());
    }

    #[test]
    fn diff_list_handles_a_full_replacement() {
        let args = diff_list_args("--blocking", "--remove-blocking", &["old".into()], &["new".into()]);
        assert_eq!(args, vec!["--blocking", "new", "--remove-blocking", "old"]);
    }
}
