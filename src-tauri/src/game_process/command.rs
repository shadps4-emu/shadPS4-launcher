use crate::game_process::game_process::{GameEvent, GameProcess};
use crate::game_process::log::{LogEntry, RowId};
use crate::game_process::{GameBridgeState, GameBridgeStateType};
use anyhow::anyhow;
use anyhow_tauri::bail;
use anyhow_tauri::IntoTAResult;
use log::{debug, error};
use std::ops::Bound;
use tauri::ipc::Channel;
use tauri_plugin_fs::FilePath;

#[tauri::command]
pub async fn game_process_spawn(
    app_handle: tauri::AppHandle,
    exe: FilePath,
    wd: FilePath,
    game_binary: FilePath,
    on_event: Channel<GameEvent<'static>>,
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
    .await
    .inspect_err(|e| error!("could not start the game: err={}", e))?;

    Ok(p.pid())
}

#[tauri::command]
pub async fn game_process_kill(state: GameBridgeState<'_>, pid: u32) -> anyhow_tauri::TAResult<()> {
    let state = state.lock().await;
    let Some(proc) = state.process_list.get(&pid) else {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    };

    Ok(proc.kill().await)
}

#[tauri::command]
pub async fn game_process_delete(state: GameBridgeState<'_>, pid: u32) -> anyhow_tauri::TAResult<()> {
    let mut state = state.lock().await;
    let res = state.process_list.remove(&pid);
    if res.is_none() {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    }
    Ok(())
}

#[tauri::command]
pub async fn game_process_get_log(
    state: GameBridgeState<'_>,
    pid: u32,
    beg: Option<RowId>,
    end: Option<RowId>,
) -> anyhow_tauri::TAResult<String> {
    let state = state.lock().await;
    let Some(proc) = state.process_list.get(&pid) else {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    };

    let log_data = proc.data().log_data.lock().await;
    Ok(serde_json::to_string(
        &log_data
            .rows
            .range((
                beg.map(|e| Bound::Included(e)).unwrap_or(Bound::Unbounded),
                end.map(|e| Bound::Included(e)).unwrap_or(Bound::Unbounded),
            ))
            .map(|(id, e)| LogEntry {
                row_id: *id,
                time: e.time,
                level: e.level,
                class: e.class,
                message: &e.message,
            })
            .collect::<Vec<LogEntry>>(),
    )
    .into_ta_result()?)
}
