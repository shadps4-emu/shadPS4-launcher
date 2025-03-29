use crate::{emu_process, file_format, utility_commands};

pub fn all_handlers() -> Box<dyn Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync> {
    Box::new(tauri::generate_handler![
        file_format::psf::js::read_psf,
        utility_commands::extract_zip,
        emu_process::start_emu_process_cmd
    ])
}
