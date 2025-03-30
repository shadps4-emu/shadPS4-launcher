use crate::game_process::game_process::{GameEvent, GameProcess};
use crate::game_process::GameBridgeState;
use anyhow::anyhow;
use anyhow_tauri::bail;
use anyhow_tauri::IntoTAResult;
use tauri::ipc::Channel;
use tauri_plugin_fs::FilePath;

#[tauri::command]
pub async fn game_process_spawn(
    app_handle: tauri::AppHandle,
    exe: FilePath,
    wd: FilePath,
    game_binary: FilePath,
    on_event: Channel<GameEvent>,
) -> anyhow_tauri::TAResult<u32> {
    let p = GameProcess::start(
        &app_handle,
        exe.as_path().ok_or(anyhow!("invalid exe"))?,
        wd.as_path().ok_or(anyhow!("invalid wd"))?,
        game_binary.as_path().ok_or(anyhow!("invalid game path"))?,
        move |ev| {
            on_event.send(ev).expect("could not send game event to js");
        },
    )
    .await?;

    Ok(p.pid())
}

#[tauri::command]
pub async fn game_process_kill(state: GameBridgeState<'_>, pid: u32) -> anyhow_tauri::TAResult<()> {
    let proc_list = state.lock().await;
    let Some(proc) = proc_list.process_list.get(&pid) else {
        bail!("pid not found");
    };

    Ok(proc.kill().await)
}
