use crate::game_process::game_process::GameProcess;
use std::collections::HashMap;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Manager};

pub struct GameBridge {
    pub(crate) process_list: HashMap<u32, GameProcess>,
}

impl GameBridge {
    pub fn register(app_handle: &AppHandle) {
        let state = GameBridge {
            process_list: Default::default(),
        };
        app_handle.manage(Mutex::new(state));
    }
}
