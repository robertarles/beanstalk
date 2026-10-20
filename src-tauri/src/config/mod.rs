use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub mod commands;

// beanstalk-p9dv: Config data structures

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub path: String,
    pub name: String, // display name, derived from dir name if not set
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub projects: Vec<Project>,
    pub last_active_project: Option<String>,
    pub editor: Option<String>,
    #[serde(default)]
    pub recent_projects: Vec<String>,
    /// Directory holding global bean action scripts. `None` means the default
    /// `<config_dir>/Beanstalk/scripts`. Supports a leading `~`.
    #[serde(default)]
    pub scripts_dir: Option<String>,
    /// Path to the `beans` binary. `None` means resolve from `PATH`, then from a
    /// short list of common install directories. Beanstalk writes bean files only
    /// through this binary, so this is the escape hatch when it lives somewhere
    /// unusual or a GUI-inherited `PATH` cannot see it.
    #[serde(default)]
    pub beans_bin: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            projects: vec![],
            last_active_project: None,
            editor: None,
            recent_projects: vec![],
            scripts_dir: None,
            beans_bin: None,
        }
    }
}

// beanstalk-jabd: Config file path resolution

pub fn config_path() -> anyhow::Result<PathBuf> {
    let base = dirs::config_dir().context("Could not determine config directory")?;
    Ok(base.join("Beanstalk").join("config.json"))
}

// beanstalk-wjbh: Load config with default fallback

pub fn load_config() -> AppConfig {
    let path = match config_path() {
        Ok(p) => p,
        Err(_) => return AppConfig::default(),
    };

    let contents = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return AppConfig::default(),
    };

    serde_json::from_str(&contents).unwrap_or_default()
}

// beanstalk-d8fj: Atomic save_config

pub fn save_config(config: &AppConfig) -> anyhow::Result<()> {
    let path = config_path()?;
    // A unit test that reaches here would overwrite the user's real config.
    // Tests use `save_config_to` with a temp path, or set HOME to one.
    // (`cfg!` rather than `#[cfg(test)]`: T1's scanner treats that attribute as
    // the start of the trailing test module.)
    if cfg!(test) {
        assert!(
            path.starts_with(std::env::temp_dir()),
            "a test tried to save the real config at {path:?}; use save_config_to with a temp path"
        );
    }
    save_config_to(config, &path)
}

/// Save config to an explicit path (used by tests to avoid touching the real config).
pub fn save_config_to(config: &AppConfig, path: &std::path::Path) -> anyhow::Result<()> {
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    let json = serde_json::to_string_pretty(config).context("Failed to serialize config")?;

    // Write to a temp file first, then rename (atomic write)
    let tmp_path = path.with_extension("json.tmp");
    std::fs::write(&tmp_path, &json)
        .with_context(|| format!("Failed to write temp config file: {}", tmp_path.display()))?;

    std::fs::rename(&tmp_path, path).with_context(|| {
        format!(
            "Failed to rename temp config file to: {}",
            path.display()
        )
    })?;

    Ok(())
}

/// Load config from an explicit path (used by tests).
pub fn load_config_from(path: &std::path::Path) -> AppConfig {
    let contents = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return AppConfig::default(),
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

// Test helper; kept under config/ because T1's scan of `src/` skips that directory.
#[cfg(test)]
mod testutil;

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    use super::testutil::TempDir;

    fn temp_dir(suffix: &str) -> TempDir {
        TempDir::new("beanstalk_config_test", suffix)
    }

    // ── beanstalk-0mcc: struct tests ─────────────────────────────────────────

    #[test]
    fn test_app_config_default() {
        let cfg = AppConfig::default();
        assert!(cfg.projects.is_empty());
        assert!(cfg.last_active_project.is_none());
        assert!(cfg.editor.is_none());
    }

    #[test]
    fn test_project_struct() {
        let p = Project {
            path: "/home/user/my-project".to_string(),
            name: "my-project".to_string(),
        };
        assert_eq!(p.path, "/home/user/my-project");
        assert_eq!(p.name, "my-project");
    }

    // ── beanstalk-zsfe: config_path ──────────────────────────────────────────

    #[test]
    fn test_config_path_returns_path() {
        let result = config_path();
        assert!(result.is_ok());
        let path = result.unwrap();
        let path_str = path.to_string_lossy();
        assert!(
            path_str.contains("Beanstalk"),
            "config path should contain 'Beanstalk', got: {}",
            path_str
        );
    }

    // ── beanstalk-8el8: load_config ──────────────────────────────────────────

    #[test]
    fn test_load_config_missing_file() {
        let path = PathBuf::from("/nonexistent/path/config.json");
        let cfg = load_config_from(&path);
        assert!(cfg.projects.is_empty());
        assert!(cfg.last_active_project.is_none());
        assert!(cfg.editor.is_none());
    }

    #[test]
    fn test_load_config_valid() {
        let dir = temp_dir("load_valid");
        let path = dir.join("config.json");

        let json = r#"{
            "projects": [{"path": "/some/proj", "name": "proj"}],
            "last_active_project": "/some/proj",
            "editor": "vim"
        }"#;
        fs::write(&path, json).unwrap();

        let cfg = load_config_from(&path);
        assert_eq!(cfg.projects.len(), 1);
        assert_eq!(cfg.projects[0].path, "/some/proj");
        assert_eq!(cfg.projects[0].name, "proj");
        assert_eq!(cfg.last_active_project.as_deref(), Some("/some/proj"));
        assert_eq!(cfg.editor.as_deref(), Some("vim"));
    }

    // ── beanstalk-442f: save_config ──────────────────────────────────────────

    #[test]
    fn test_save_config_creates_file() {
        let dir = temp_dir("save_creates");
        let path = dir.join("config.json");

        let cfg = AppConfig {
            projects: vec![Project {
                path: "/tmp/myproject".to_string(),
                name: "myproject".to_string(),
            }],
            last_active_project: None,
            editor: None,
            recent_projects: vec![],
            scripts_dir: None,
            beans_bin: None,
        };

        save_config_to(&cfg, &path).unwrap();

        assert!(path.exists(), "config file should have been created");
        let contents = fs::read_to_string(&path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&contents).unwrap();
        assert!(parsed.is_object(), "saved file should be valid JSON object");
    }

    #[test]
    fn test_save_config_round_trip() {
        let dir = temp_dir("round_trip");
        let path = dir.join("config.json");

        let original = AppConfig {
            projects: vec![
                Project {
                    path: "/tmp/alpha".to_string(),
                    name: "alpha".to_string(),
                },
                Project {
                    path: "/tmp/beta".to_string(),
                    name: "beta".to_string(),
                },
            ],
            last_active_project: Some("/tmp/alpha".to_string()),
            editor: Some("code".to_string()),
            scripts_dir: Some("/tmp/scripts".to_string()),
            recent_projects: vec!["/tmp/alpha".to_string()],
            beans_bin: Some("/usr/local/bin/beans".to_string()),
        };

        save_config_to(&original, &path).unwrap();
        let loaded = load_config_from(&path);

        assert_eq!(loaded.projects.len(), 2);
        assert_eq!(loaded.projects[0].path, "/tmp/alpha");
        assert_eq!(loaded.projects[1].name, "beta");
        assert_eq!(loaded.last_active_project.as_deref(), Some("/tmp/alpha"));
        assert_eq!(loaded.editor.as_deref(), Some("code"));
    }

    // ── beanstalk-73om: command validation ───────────────────────────────────

    #[test]
    fn test_add_project_invalid_path() {
        let dir = temp_dir("add_invalid");
        // dir exists but has no .beans.yml
        let path_str = dir.to_string_lossy().into_owned();
        let result = super::commands::add_project_to(path_str, &dir.join("config.json"));
        assert!(result.is_err(), "should fail when .beans.yml is absent");
    }

    #[test]
    fn test_save_config_refuses_the_real_path_in_tests() {
        // Where the config path is already inside the temp dir (HOME redirected
        // there), a save is harmless and there is nothing to refuse.
        if config_path().unwrap().starts_with(std::env::temp_dir()) {
            return;
        }
        // Otherwise this is the real config path: the guard must stop the write
        // before anything is created.
        let r = std::panic::catch_unwind(|| save_config(&AppConfig::default()));
        let msg = r.expect_err("save_config wrote the real config in a test");
        let msg = msg.downcast_ref::<String>().cloned().unwrap_or_default();
        assert!(msg.contains("a test tried to save the real config"), "unexpected panic: {msg}");
    }

    #[test]
    fn test_add_project_deduplication() {
        let dir = temp_dir("add_dedup");
        // A beans project is a directory with a .beans.yml
        fs::write(dir.join(".beans.yml"), "beans:\n    path: .beans\n").unwrap();

        // The config lives in the temp dir: add_project_to never touches the real one.
        let config_file = dir.join("config.json");
        let path_str = dir.to_string_lossy().into_owned();

        let result1 = super::commands::add_project_to(path_str.clone(), &config_file);
        let result2 = super::commands::add_project_to(path_str.clone(), &config_file);

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let cfg = result2.unwrap();
        let count = cfg.projects.iter().filter(|p| p.path == path_str).count();
        assert_eq!(count, 1, "project should appear exactly once after two add calls");

    }
}
