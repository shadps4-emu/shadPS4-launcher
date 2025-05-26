pub(crate) mod command;
mod game_process;
mod ipc;
mod log;
pub mod state;

use crate::game_process::state::GameBridge;
use tauri::async_runtime::Mutex;
use tauri::State;

pub type GameBridgeStateType = Mutex<GameBridge>;

pub type GameBridgeState<'a> = State<'a, GameBridgeStateType>;
