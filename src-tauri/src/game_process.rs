pub(crate) mod command;
pub mod state;
mod game_process;
mod ipc;

use tauri::async_runtime::Mutex;
use tauri::State;
use crate::game_process::state::GameBridge;

pub type GameBridgeStateType = Mutex<GameBridge>;

pub type GameBridgeState<'a> = State<'a, GameBridgeStateType>;
