// Tauri commands for the bean action menu.

use super::{discover_scripts, run_script, BeanScript, ScriptOutput};

/// List the scripts available for a project, global and project-local merged.
///
/// Called every time the action menu opens, so it must stay cheap: discovery
/// only stats files and reads each candidate's first few lines.
#[tauri::command]
pub fn list_bean_scripts(project_path: String) -> Result<Vec<BeanScript>, String> {
    let configured = crate::config::load_config().scripts_dir;
    Ok(discover_scripts(&project_path, configured.as_deref()))
}

/// Run a script against a bean.
///
/// The script is re-discovered by id rather than taking a path from the
/// frontend, so the renderer cannot ask the backend to execute an arbitrary
/// file on disk.
#[tauri::command]
pub fn run_bean_script(
    project_path: String,
    bean_id: String,
    script_id: String,
) -> Result<ScriptOutput, String> {
    let configured = crate::config::load_config().scripts_dir;
    let script = discover_scripts(&project_path, configured.as_deref())
        .into_iter()
        .find(|s| s.id == script_id)
        .ok_or_else(|| format!("Script not found: {script_id}"))?;

    let bean = crate::commands::get_bean(project_path.clone(), bean_id)?;

    run_script(&script, &bean, &project_path)
}

/// Return the resolved scripts directories, so the UI can tell the user where
/// to put a script when the menu is empty.
#[tauri::command]
pub fn get_scripts_dirs(project_path: String) -> Result<Vec<String>, String> {
    let configured = crate::config::load_config().scripts_dir;
    let global = super::global_scripts_dir(configured.as_deref())
        .map(|p| p.to_string_lossy().into_owned());
    let project = super::project_scripts_dir(&project_path)
        .to_string_lossy()
        .into_owned();

    Ok(global.into_iter().chain(std::iter::once(project)).collect())
}
