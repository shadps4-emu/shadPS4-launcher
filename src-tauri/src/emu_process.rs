use anyhow::anyhow;
use anyhow_tauri::IntoTAResult;
use std::path::Path;
use std::process::{Command, Stdio};
use tauri_plugin_fs::FilePath;

fn start_emu_process(
    exe: impl AsRef<Path>,
    wd: impl AsRef<Path>,
    game: impl AsRef<Path>,
) -> anyhow::Result<()> {
    Command::new(exe.as_ref().as_os_str())
        .current_dir(wd)
        .arg(game.as_ref().as_os_str())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;
    Ok(())
}

#[tauri::command]
pub fn start_emu_process_cmd(
    exe: FilePath,
    wd: FilePath,
    game_binary: FilePath,
) -> anyhow_tauri::TAResult<()> {
    start_emu_process(
        exe.as_path().ok_or(anyhow!("invalid exe"))?,
        wd.as_path().ok_or(anyhow!("invalid wd"))?,
        game_binary.as_path().ok_or(anyhow!("invalid game path"))?,
    )
    .into_ta_result()
}
