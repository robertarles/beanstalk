// Beanstalk - macOS GUI for managing beans issues
// Module declarations for future implementation

pub mod commands;  // Tauri commands exposed to frontend
pub mod beans;     // Bean file parsing and data models
pub mod config; // Application configuration persistence
pub mod watcher;   // File system watcher for live bean updates

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(std::sync::Mutex::new(std::collections::HashMap::<String, watcher::FileWatcher>::new()))
        .invoke_handler(tauri::generate_handler![
            config::commands::get_config,
            config::commands::add_project,
            config::commands::remove_project,
            config::commands::set_active_project,
            config::commands::update_config,
            commands::get_beans,
            commands::get_bean,
            commands::create_bean,
            commands::update_bean,
            commands::update_bean_status,
            commands::search_beans,
            commands::open_bean_in_editor,
            watcher::start_watching,
            watcher::stop_watching,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
