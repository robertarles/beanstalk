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
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            projects: vec![],
            last_active_project: None,
            editor: None,
            recent_projects: vec![],
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

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn temp_dir(suffix: &str) -> PathBuf {
        let base = std::env::temp_dir();
        let dir = base.join(format!(
            "beanstalk_config_test_{}_{}",
            suffix,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .subsec_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
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
            recent_projects: vec!["/tmp/alpha".to_string()],
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
        // dir exists but has no .beans/ subdirectory
        let path_str = dir.to_string_lossy().into_owned();
        let result = super::commands::add_project(path_str);
        assert!(result.is_err(), "should fail when .beans/ dir is absent");
    }

    #[test]
    fn test_add_project_deduplication() {
        let dir = temp_dir("add_dedup");
        // Create required .beans/ dir
        fs::create_dir_all(dir.join(".beans")).unwrap();

        // Also set up a temp config path so we don't pollute real config.
        // add_project calls load_config() / save_config() which use the real
        // config path.  We can't easily override that without refactoring the
        // command, so we call it twice and verify the returned config has only
        // one entry for the project.
        let path_str = dir.to_string_lossy().into_owned();

        let result1 = super::commands::add_project(path_str.clone());
        let result2 = super::commands::add_project(path_str.clone());

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let cfg = result2.unwrap();
        let count = cfg.projects.iter().filter(|p| p.path == path_str).count();
        assert_eq!(count, 1, "project should appear exactly once after two add calls");

        // Cleanup: remove the project from real config so tests don't pollute state.
        let mut cleanup_cfg = super::load_config();
        cleanup_cfg.projects.retain(|p| p.path != path_str);
        let _ = super::save_config(&cleanup_cfg);
    }
}
