// beanstalk-dhgw: Tauri commands with validation

use super::{load_config, save_config, AppConfig, Project};
use std::path::Path;

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
