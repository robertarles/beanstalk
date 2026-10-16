// beanstalk-dhgw: Tauri commands with validation

use super::{load_config, save_config, AppConfig, Project};
use crate::beans::parse_beans_config;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// The default id prefix used when a project's `.beans.yml` declares none.
///
/// Must stay in step with `crate::commands::create_bean`, which mints ids with
/// the same fallback. If they disagree, a prefix-less project's own beans stop
/// resolving against it.
pub const DEFAULT_PREFIX: &str = "bean-";

#[tauri::command]
pub fn get_config() -> AppConfig {
    load_config()
}

/// Normalize a user-supplied path to a project root directory.
///
/// If the path points inside a `.beans/` subdirectory (e.g. a bean file path
/// like `/project/.beans/bean-xyz.md`), strip back to the project root so
/// that only proper project directory paths end up in `recent_projects`.
fn normalize_project_path(path: &str) -> String {
    let trimmed = path.trim_end_matches('/').trim_end_matches('\\');
    // Find the last occurrence of "/.beans" and take everything before it.
    if let Some(pos) = trimmed.rfind("/.beans") {
        return trimmed[..pos].to_string();
    }
    // Also handle Windows-style separator.
    if let Some(pos) = trimmed.rfind("\\.beans") {
        return trimmed[..pos].to_string();
    }
    trimmed.to_string()
}

#[tauri::command]
pub fn add_project(path: String) -> Result<AppConfig, String> {
    // Normalize to project root in case the user passed a path inside .beans/.
    let path = normalize_project_path(&path);

    // Validate that path/.beans/ directory exists
    let beans_dir = Path::new(&path).join(".beans");
    if !beans_dir.is_dir() {
        return Err(format!(
            "Not a valid Beanstalk project: .beans/ directory not found in {}",
            path
        ));
    }

    // Derive name from last path component
    let name = Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&path)
        .to_string();

    let mut config = load_config();

    // Maintain recents list: move path to front, deduplicate, cap at 10
    config.recent_projects.retain(|p| p != &path);
    config.recent_projects.insert(0, path.clone());
    config.recent_projects.truncate(10);

    // Avoid duplicates in the active projects list
    if !config.projects.iter().any(|p| p.path == path) {
        config.projects.push(Project { path, name });
    }

    save_config(&config).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub fn remove_project(path: String) -> Result<AppConfig, String> {
    let mut config = load_config();

    config.projects.retain(|p| p.path != path);

    // Clear last_active_project if it was the removed project
    if config.last_active_project.as_deref() == Some(&path) {
        config.last_active_project = None;
    }

    save_config(&config).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub fn set_active_project(path: String) -> Result<AppConfig, String> {
    let mut config = load_config();

    // Validate that the project exists in the config
    if !config.projects.iter().any(|p| p.path == path) {
        return Err(format!("Project not found in config: {}", path));
    }

    config.last_active_project = Some(path);

    save_config(&config).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub fn update_config(config: AppConfig) -> Result<AppConfig, String> {
    save_config(&config).map_err(|e| e.to_string())?;
    Ok(config)
}


// beanstalk-1j24: id prefix → project routing

/// A configured project together with the id prefix its beans carry.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProjectPrefix {
    pub path: String,
    pub name: String,
    pub prefix: String,
}

/// List every configured project with its bean id prefix.
///
/// This is what lets a bare id like `hivelens-7k2p` be routed to the project
/// that owns it without reading a single bean from that project: ids are minted
/// as `{prefix}{random}`, so the prefix alone identifies the owner.
///
/// Duplicates are deliberately *not* removed. Nothing stops two projects
/// declaring the same prefix (or defaulting to the same one), and a caller that
/// cannot see the collision would resolve such ids to an arbitrary project. The
/// caller is expected to detect repeats and decline to resolve them.
///
/// Cost is one small config read per project. No bean files are opened.
#[tauri::command]
pub fn get_project_prefixes() -> Vec<ProjectPrefix> {
    project_prefixes(load_config().projects)
}

/// The body of [`get_project_prefixes`], split out so it can be tested against
/// temporary project directories instead of the user's real config file.
pub fn project_prefixes(projects: Vec<Project>) -> Vec<ProjectPrefix> {
    projects
        .into_iter()
        .map(|p| {
            let prefix = parse_beans_config(Path::new(&p.path))
                .prefix
                .unwrap_or_else(|| DEFAULT_PREFIX.to_string());
            ProjectPrefix { path: p.path, name: p.name, prefix }
        })
        .collect()
}

#[cfg(test)]
mod prefix_tests {
    use super::*;
    use std::fs;

    fn temp_project(tag: &str, yml: Option<&str>) -> String {
        let dir = std::env::temp_dir().join(format!("beanstalk_prefix_{tag}_{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join(".beans")).unwrap();
        if let Some(body) = yml {
            fs::write(dir.join(".beans.yml"), body).unwrap();
        }
        dir.to_string_lossy().to_string()
    }

    fn project(path: String, name: &str) -> Project {
        Project { path, name: name.to_string() }
    }

    #[test]
    fn reads_the_declared_prefix() {
        let path = temp_project("declared", Some("beans:\n    prefix: hivelens-\n"));
        let out = project_prefixes(vec![project(path.clone(), "hivelens")]);
        assert_eq!(out, vec![ProjectPrefix { path, name: "hivelens".into(), prefix: "hivelens-".into() }]);
    }

    #[test]
    fn falls_back_to_the_same_default_create_bean_uses() {
        let path = temp_project("nodefault", None);
        let out = project_prefixes(vec![project(path, "plain")]);
        assert_eq!(out[0].prefix, DEFAULT_PREFIX);
    }

    #[test]
    fn keeps_duplicates_so_callers_can_see_a_collision() {
        let a = temp_project("dupa", Some("beans:\n    prefix: shared-\n"));
        let b = temp_project("dupb", Some("beans:\n    prefix: shared-\n"));
        let out = project_prefixes(vec![project(a, "a"), project(b, "b")]);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].prefix, "shared-");
        assert_eq!(out[1].prefix, "shared-");
    }

    #[test]
    fn empty_config_yields_nothing() {
        assert!(project_prefixes(vec![]).is_empty());
    }
}
