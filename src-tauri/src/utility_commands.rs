use std::{fs, fs::File, io, path::Path};

use anyhow_tauri::IntoTAResult;
use log::error;
use tauri::{State, Wry};
use tauri_plugin_fs::FilePath;
use tauri_plugin_opener::Opener;
use zip::ZipArchive;

fn extract_zip_internal(zip_path: &Path, extract_path: &Path) -> anyhow::Result<()> {
    let file = File::open(zip_path)?;

    let mut archive = ZipArchive::new(file)?;
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;

        let inner_path = match file.enclosed_name() {
            Some(path) => path,
            None => continue,
        };

        let final_path = extract_path.join(inner_path);

        if file.is_dir() {
            fs::create_dir_all(&final_path)?;
        } else {
            if let Some(p) = final_path.parent() {
                if !p.exists() {}
                fs::create_dir_all(p)?
            }
            let mut out_file = File::create(&final_path)?;
            io::copy(&mut file, &mut out_file)?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&final_path, fs::Permissions::from_mode(mode)).unwrap();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn extract_zip(zip_path: FilePath, extract_path: FilePath) -> anyhow_tauri::TAResult<()> {
    let zip_path = zip_path
        .as_path()
        .ok_or(anyhow::anyhow!("zip_path is not a valid path"))
        .into_ta_result()?;
    let extract_path = extract_path
        .as_path()
        .ok_or(anyhow::anyhow!("extract_path is not a valid path"))
        .into_ta_result()?;
    extract_zip_internal(zip_path, extract_path)
        .inspect_err(|e| error!("could not extract zip: err={}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_path(
    opener: State<Opener<Wry>, '_>,
    path: String,
) -> Result<(), tauri_plugin_opener::Error> {
    #[cfg(target_os = "linux")]
    let r = opener.open_path(&path, Some("xdg-open"));
    #[cfg(not(target_os = "linux"))]
    let r = opener.open_path(&path, None::<&str>);
    r.inspect_err(|e| error!("could not open explorer: path={}, err={}", &path, e))
}
