use crate::file_format::psf::PSF;
use anyhow::{Context, ensure};
use anyhow_tauri::{IntoTAResult, TAResult};
use log::error;
use std::fs::metadata;
use std::io::Cursor;
use std::path::Path;
use tauri_plugin_fs::SafeFilePath;
use zarchive::Archive;

const PARAM_SFO_PATH: &str = "sce_sys/param.sfo";
const ICON_PATH: &str = "sce_sys/icon0.png";
const MAX_PARAM_SFO_SIZE: u64 = 16 * 1024 * 1024;
const MAX_ICON_SIZE: u64 = 32 * 1024 * 1024;

#[tauri::command]
pub async fn inspect_zar_game(path: SafeFilePath) -> TAResult<Option<PSF>> {
    tokio::task::spawn_blocking(|| {
        let path = path.into_path()?;
        inspect_zar_game_path(&path)
    })
    .await
    .into_ta_result()?
    .into_ta_result()
}

fn inspect_zar_game_path(path: &Path) -> anyhow::Result<Option<PSF>> {
    let mut archive = open_archive(path)?;

    ensure!(
        archive
            .entry("eboot.bin")?
            .is_some_and(|entry| entry.is_file()),
        "ZArchive does not contain eboot.bin"
    );

    let Some(data) = read_entry(&mut archive, PARAM_SFO_PATH, MAX_PARAM_SFO_SIZE)? else {
        return Ok(None);
    };

    let mut psf = PSF::new();
    psf.last_write = metadata(path)?.modified()?;
    psf.read(Cursor::new(data))
        .inspect_err(|e| error!("error reading PSF from ZArchive: {e}"))?;

    Ok(Some(psf))
}

#[tauri::command]
pub async fn read_zar_icon(path: SafeFilePath) -> TAResult<Option<Vec<u8>>> {
    tokio::task::spawn_blocking(|| {
        let path = path.into_path()?;
        read_zar_icon_path(&path)
    })
    .await
    .into_ta_result()?
    .into_ta_result()
}

fn read_zar_icon_path(path: &Path) -> anyhow::Result<Option<Vec<u8>>> {
    let mut archive = open_archive(path)?;
    read_entry(&mut archive, ICON_PATH, MAX_ICON_SIZE)
}

fn open_archive(path: &Path) -> anyhow::Result<Archive<std::fs::File>> {
    Archive::open(path).with_context(|| format!("could not open ZArchive: {}", path.display()))
}

fn read_entry(
    archive: &mut Archive<std::fs::File>,
    path: &str,
    max_size: u64,
) -> anyhow::Result<Option<Vec<u8>>> {
    let Some(entry) = archive.entry(path)? else {
        return Ok(None);
    };
    ensure!(entry.is_file(), "ZArchive entry is not a file: {path}");
    ensure!(
        entry.len() <= max_size,
        "ZArchive entry is too large: {path}"
    );
    archive.read(path).map_err(Into::into)
}

#[cfg(test)]
mod tests {
    use super::{ICON_PATH, PARAM_SFO_PATH, inspect_zar_game_path, read_zar_icon_path};
    use std::fs::{File, remove_file};
    use std::io::Cursor;
    use std::time::{SystemTime, UNIX_EPOCH};
    use zarchive::ArchiveWriter;

    #[test]
    fn reads_game_metadata_and_icon_from_zarchive() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("current time should follow the Unix epoch")
            .as_nanos();
        let archive_path = std::env::temp_dir().join(format!(
            "shadps4-launcher-zar-test-{}-{unique}.zar",
            std::process::id()
        ));

        let mut writer =
            ArchiveWriter::new(File::create(&archive_path).expect("test archive should open"))
                .expect("archive writer should initialize");
        writer
            .create_dir("sce_sys")
            .expect("sce_sys directory should be created");
        writer
            .add_file("eboot.bin", Cursor::new(b"test eboot"))
            .expect("eboot should be added");
        writer
            .add_file(PARAM_SFO_PATH, Cursor::new(minimal_psf()))
            .expect("PSF should be added");
        writer
            .add_file(ICON_PATH, Cursor::new(b"test icon"))
            .expect("icon should be added");
        writer.finish().expect("archive should finalize");

        let psf = inspect_zar_game_path(&archive_path).expect("archive inspection should succeed");
        assert!(psf.is_some());
        assert_eq!(
            read_zar_icon_path(&archive_path)
                .expect("icon read should succeed")
                .as_deref(),
            Some(b"test icon".as_slice())
        );

        remove_file(archive_path).expect("test archive should be removed");
    }

    fn minimal_psf() -> Vec<u8> {
        let mut data = Vec::with_capacity(20);
        data.extend_from_slice(&[0x00, 0x50, 0x53, 0x46]);
        data.extend_from_slice(&0x0000_0101_u32.to_le_bytes());
        data.extend_from_slice(&20_u32.to_le_bytes());
        data.extend_from_slice(&20_u32.to_le_bytes());
        data.extend_from_slice(&0_u32.to_le_bytes());
        data
    }
}
