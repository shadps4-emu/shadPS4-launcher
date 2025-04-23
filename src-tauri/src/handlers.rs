use crate::{file_format, game_process, utility_commands};

pub fn all_handlers() -> Box<dyn Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync> {
    Box::new(tauri::generate_handler![
        file_format::psf::js::read_psf,
        game_process::command::game_process_kill,
        game_process::command::game_process_spawn,
        utility_commands::extract_zip,
        utility_commands::make_it_executable,
        utility_commands::open_path,
    ])
}
