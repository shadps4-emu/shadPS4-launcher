#![feature(let_chains)]

use crate::game_process::state::GameBridge;
use log::info;
use tauri::Manager;
use crate::logger::build_log_plugin;

mod file_format;
mod game_process;
mod handlers;
mod logger;
mod utility_commands;
mod db_migrations;

pub fn run() {
    let logger_plugin = build_log_plugin();
    tauri::Builder::default()
        .invoke_handler(handlers::all_handlers())
        .plugin(logger_plugin)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            info!("Requesting to open main window");
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:data.db", db_migrations::gen_migrations())
                .build()
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_upload::init())
        .setup(|app| {
            let commit = option_env!("GIT_HASH");
            if let Some(commit) = commit {
                info!("Starting app. build git ref={}", commit);
            } else {
                info!("Starting app. Unknown build git ref");
            }
            GameBridge::register(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
