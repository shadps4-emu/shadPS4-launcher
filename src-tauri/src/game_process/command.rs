use crate::game_process::GameBridgeState;
use crate::game_process::game_process::{GameEvent, GameProcess};
use crate::game_process::log::{Level, LogEntry};
use anyhow::anyhow;
use anyhow_tauri::IntoTAResult;
use anyhow_tauri::bail;
use log::{debug, error};
use std::ffi::OsString;
use std::fs::File;
use std::io::Write;
use tauri::ipc::Channel;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FilePath;
use time::macros::format_description;

#[tauri::command]
pub async fn game_process_spawn(
    app_handle: tauri::AppHandle,
    state: GameBridgeState<'_>,
    exe: FilePath,
    wd: FilePath,
    args: Vec<String>,
    on_event: Channel<GameEvent<'static>>,
    copy_data_from_pid: Option<u32>,
) -> anyhow_tauri::TAResult<u32> {
    let args: Vec<OsString> = args.into_iter().map(|s| OsString::from(s)).collect();

    let mut data = None;
    if let Some(old_pid) = copy_data_from_pid {
        let state = state.lock().await;
        let Some(old_proc) = state.process_list.get(&old_pid) else {
            bail!("old process not found");
        };
        data = Some(old_proc.data().clone());
    }

    let p = GameProcess::start(
        &app_handle,
        exe.as_path().ok_or(anyhow!("invalid exe"))?,
        wd.as_path().ok_or(anyhow!("invalid wd"))?,
        args,
        move |ev| {
            on_event.send(ev).expect("could not send game event to js");
        },
        data,
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

    proc.kill().await?;
    Ok(())
}

#[tauri::command]
pub async fn game_process_send(
    state: GameBridgeState<'_>,
    pid: u32,
    value: &str,
) -> anyhow_tauri::TAResult<()> {
    let state = state.lock().await;
    let Some(proc) = state.process_list.get(&pid) else {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    };

    proc.send(value).await?;
    Ok(())
}

#[tauri::command]
pub async fn game_process_delete(
    state: GameBridgeState<'_>,
    pid: u32,
) -> anyhow_tauri::TAResult<()> {
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
    level: Option<Vec<Level>>,
    log_class: Option<Vec<&str>>,
) -> anyhow_tauri::TAResult<String> {
    let state = state.lock().await;
    let Some(proc) = state.process_list.get(&pid) else {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    };

    let log_class = log_class.unwrap_or_default();
    let level = level.unwrap_or_default();

    let log_data = proc.data().log_data.lock().await;
    let rows = log_data
        .rows
        .iter()
        .filter(|(_, e)| level.is_empty() || level.contains(&e.level))
        .filter(|(_, e)| log_class.is_empty() || log_class.contains(&e.class))
        .map(|(i, e)| (*i, e).into())
        .collect::<Vec<LogEntry>>();

    Ok(serde_json::to_string(&rows).into_ta_result()?)
}

#[tauri::command]
pub async fn game_process_save_log(
    app_handle: tauri::AppHandle,
    state: GameBridgeState<'_>,
    pid: u32,
    default_name: String,
    level: Option<Vec<Level>>,
    log_class: Option<Vec<&str>>,
) -> anyhow_tauri::TAResult<()> {
    let state = state.lock().await;
    let Some(proc) = state.process_list.get(&pid) else {
        debug!("process not found: pid={}", pid);
        bail!("pid not found");
    };

    let Some(path) = app_handle
        .dialog()
        .file()
        .set_file_name(default_name)
        .add_filter("shadPS4 Log", &["txt"])
        .blocking_save_file()
    else {
        return Ok(());
    };
    let path = path.into_path().map_err(|e| anyhow!("invalid path: err={}", e))?;

    let Ok(mut file) = File::create(path) else {
        bail!("Could not open the file for writing");
    };

    let log_class = log_class.unwrap_or_default();
    let level = level.unwrap_or_default();
    let log_data = proc.data().log_data.lock().await;
    let rows = log_data
        .rows
        .iter()
        .filter(|(_, e)| level.is_empty() || level.contains(&e.level))
        .filter(|(_, e)| log_class.is_empty() || log_class.contains(&e.class));

    let line_time_fmt = format_description!("[hour]:[minute]:[second]");
    for (_, row) in rows {
        let r = write!(
            &mut file,
            "{} [{}] <{}> {}\n",
            row.time.format(line_time_fmt).unwrap(),
            row.class,
            row.level.as_ref(),
            &row.message
        );
        if let Err(err) = r {
            bail!("could not write to file: err={}", err);
        }
    }

    Ok(())
}
