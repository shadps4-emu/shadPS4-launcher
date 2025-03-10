use std::{fs, fs::File, io, path::Path};

use anyhow_tauri::IntoTAResult;
use tauri_plugin_fs::SafeFilePath;
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
            fs::create_dir_all(final_path)?;
        } else {
            if let Some(p) = final_path.parent() {
                if !p.exists() {}
                fs::create_dir_all(p)?
            }
            let mut out_file = File::create(final_path)?;
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
pub fn extract_zip(
    zip_path: SafeFilePath,
    extract_path: SafeFilePath,
) -> anyhow_tauri::TAResult<()> {
    let zip_path = zip_path
        .as_path()
        .ok_or(anyhow::anyhow!("zip_path is not a valid path"))
        .into_ta_result()?;
    extract_zip_internal(zip_path, extract_path.as_path().unwrap())?;
    Ok(())
}
