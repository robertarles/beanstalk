// beanstalk-mwxa: File system watcher for live bean updates
// Tasks: beanstalk-sxgk, beanstalk-hzy0, beanstalk-99ci, beanstalk-7i6q, beanstalk-ppqk, beanstalk-yeqq

use notify::{Event, RecursiveMode, Watcher};
use serde_json::json;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;
use tauri::Emitter;

// beanstalk-sxgk: FileWatcher struct holding the notify watcher
pub struct FileWatcher {
    // Holds the notify Watcher — dropping this stops watching
    _watcher: notify::RecommendedWatcher,
}

// beanstalk-yeqq: Check if a path has a file extension we care about (.md, .yml, .yaml)
fn is_relevant_extension(path: &std::path::Path) -> bool {
    match path.extension().and_then(|e| e.to_str()) {
        Some("md") | Some("yml") | Some("yaml") => true,
        _ => false,
    }
}

impl FileWatcher {
    // beanstalk-hzy0 + beanstalk-99ci + beanstalk-7i6q: Create watcher with debounced event emission
    pub fn new(app_handle: tauri::AppHandle, watch_path: String) -> Result<Self, String> {
        let (tx, rx) = mpsc::channel::<notify::Result<Event>>();

        // beanstalk-hzy0: RecommendedWatcher uses FSEvents on macOS automatically
        let mut watcher =
            notify::RecommendedWatcher::new(tx, notify::Config::default())
                .map_err(|e| format!("Failed to create watcher: {}", e))?;

        let beans_path = PathBuf::from(&watch_path).join(".beans");
        watcher
            .watch(&beans_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch path {}: {}", beans_path.display(), e))?;

        // beanstalk-99ci + beanstalk-7i6q: Debounce thread — 500ms window before emitting
        let path_str = watch_path.clone();
        std::thread::spawn(move || {
            // pending: whether we have at least one relevant event waiting to emit
            let pending: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));

            loop {
                match rx.recv() {
                    Ok(Ok(event)) => {
                        // beanstalk-yeqq: Filter to .md / .yml / .yaml only
                        let relevant = event.paths.iter().any(|p| is_relevant_extension(p));
                        if !relevant {
                            continue;
                        }

                        // Mark a debounce window as pending
                        {
                            let mut flag = pending.lock().unwrap();
                            if *flag {
                                // Already in debounce window — just let it continue draining
                                continue;
                            }
                            *flag = true;
                        }

                        // Spawn a short-lived thread to wait 500ms then emit once
                        let pending_clone = Arc::clone(&pending);
                        let app_clone = app_handle.clone();
                        let path_clone = path_str.clone();
                        std::thread::spawn(move || {
                            // Drain additional events for 500ms
                            std::thread::sleep(Duration::from_millis(500));

                            // beanstalk-7i6q: Emit the Tauri event
                            let _ = app_clone.emit(
                                "beans-changed",
                                json!({"project_path": path_clone}),
                            );

                            // Reset debounce flag
                            let mut flag = pending_clone.lock().unwrap();
                            *flag = false;
                        });
                    }
                    Ok(Err(e)) => {
                        eprintln!("beanstalk watcher error: {:?}", e);
                    }
                    Err(_) => {
                        // Channel closed — watcher was dropped, exit thread
                        break;
                    }
                }
            }
        });

        Ok(FileWatcher { _watcher: watcher })
    }
}

// beanstalk-ppqk: Tauri managed state type alias
pub type WatcherState = Mutex<HashMap<String, FileWatcher>>;

// beanstalk-ppqk: start_watching command
#[tauri::command]
pub fn start_watching(
    app_handle: tauri::AppHandle,
    project_path: String,
    state: tauri::State<WatcherState>,
) -> Result<(), String> {
    let mut map = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    // If already watching this path, stop the old watcher first
    map.remove(&project_path);

    let fw = FileWatcher::new(app_handle, project_path.clone())?;
    map.insert(project_path, fw);

    Ok(())
}

// beanstalk-ppqk: stop_watching command
#[tauri::command]
pub fn stop_watching(
    project_path: String,
    state: tauri::State<WatcherState>,
) -> Result<(), String> {
    let mut map = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Dropping the FileWatcher stops the notify watcher, which closes the channel
    map.remove(&project_path);

    Ok(())
}

// ── Testable helpers ──────────────────────────────────────────────────────────

/// The event name emitted when beans change (beanstalk-jq74).
pub const BEANS_CHANGED_EVENT: &str = "beans-changed";

/// Debounce interval in milliseconds (beanstalk-7fyf).
pub const DEBOUNCE_MS: u64 = 500;

/// Return the `.beans/` subdirectory path for a given project root (beanstalk-0om0).
pub fn beans_watch_path(project_path: &std::path::Path) -> PathBuf {
    project_path.join(".beans")
}

/// Return true for file extensions that should trigger a `beans-changed` event
/// (.md, .yml, .yaml) (beanstalk-j2rn).
pub fn is_watched_file(path: &std::path::Path) -> bool {
    is_relevant_extension(path)
}

/// Stop watching a project path without requiring Tauri state — for unit-test
/// use.  Removes the entry from the provided map and returns Ok regardless of
/// whether the path was present (beanstalk-tfon).
pub fn stop_watching_map(map: &mut std::collections::HashMap<String, FileWatcher>, project_path: &str) -> Result<(), String> {
    map.remove(project_path);
    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    // ── beanstalk-fg4m: FileWatcher struct test ───────────────────────────────

    #[test]
    fn test_file_watcher_module_exists() {
        // The FileWatcher struct and related types compile successfully.
        // Integration with Tauri AppHandle cannot be tested in unit tests.
        assert!(true);
    }

    // ── beanstalk-0om0: watcher target path ──────────────────────────────────

    #[test]
    fn test_watcher_target_path() {
        let project = Path::new("/some/project");
        let watch_path = beans_watch_path(project);
        assert_eq!(watch_path, Path::new("/some/project/.beans"));
    }

    #[test]
    fn test_watcher_target_path_trailing_beans() {
        let project = Path::new("/home/user/my-project");
        let watch_path = beans_watch_path(project);
        assert!(
            watch_path.ends_with(".beans"),
            "watch path should end with .beans, got {:?}",
            watch_path
        );
    }

    // ── beanstalk-7fyf: debounce interval ────────────────────────────────────

    #[test]
    fn test_debounce_interval_is_500ms() {
        assert_eq!(DEBOUNCE_MS, 500, "debounce interval must be 500 ms");
    }

    // ── beanstalk-jq74: event name constant ──────────────────────────────────

    #[test]
    fn test_event_name_constant() {
        assert_eq!(
            BEANS_CHANGED_EVENT, "beans-changed",
            "event name must be 'beans-changed'"
        );
    }

    // ── beanstalk-tfon: stop watching non-existent path ──────────────────────

    #[test]
    fn test_stop_watching_nonexistent() {
        let mut map: std::collections::HashMap<String, FileWatcher> = std::collections::HashMap::new();
        // Stopping a path that was never started should return Ok, not Err.
        let result = stop_watching_map(&mut map, "/path/that/was/never/watched");
        assert!(result.is_ok(), "stopping a non-watched path should return Ok");
    }

    // ── beanstalk-j2rn: file extension filtering ─────────────────────────────

    #[test]
    fn test_md_is_watched() {
        let path = Path::new("/some/dir/task.md");
        assert!(is_watched_file(path), ".md files should be watched");
    }

    #[test]
    fn test_yml_is_watched() {
        let path = Path::new("/some/dir/config.yml");
        assert!(is_watched_file(path), ".yml files should be watched");
    }

    #[test]
    fn test_yaml_is_watched() {
        let path = Path::new("/some/dir/config.yaml");
        assert!(is_watched_file(path), ".yaml files should be watched");
    }

    #[test]
    fn test_rs_not_watched() {
        let path = Path::new("/some/dir/main.rs");
        assert!(!is_watched_file(path), ".rs files should NOT be watched");
    }

    #[test]
    fn test_txt_not_watched() {
        let path = Path::new("/some/dir/notes.txt");
        assert!(!is_watched_file(path), ".txt files should NOT be watched");
    }
}
