use crate::game_process::log::{Entry, LogData, LogEntry};
use crate::game_process::{log, GameBridgeStateType};
use anyhow::Context;
use serde::Serialize;
use std::ffi::OsStr;
use std::path::Path;
use std::process::Stdio;
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Manager};
use time::OffsetDateTime;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc::{channel, Sender};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event")]
pub enum GameEvent<'a> {
    Log(LogEntry<'a>),
    AddLogClass { value: &'a str },
    GameExit { status: i32 },
    IOError { err: String },
    IpcLine { value: &'a str },
}

enum InnerCommand {
    Kill,
}

#[derive(Clone)]
pub struct GameProcess {
    pid: u32,
    #[allow(dead_code)]
    data: ProcessData,

    sender: Arc<Mutex<Sender<String>>>, // These are commands sent to the emulator
    inner_sender: Arc<Mutex<Sender<InnerCommand>>>, // These are commands sent to the launcher
}

#[derive(Clone)]
pub struct ProcessData {
    pub log_data: Arc<Mutex<LogData>>,
}

impl GameProcess {
    pub async fn start<'b, S>(
        app_handle: &'b AppHandle,
        exe: impl AsRef<Path>,
        wd: impl AsRef<Path>,
        args: impl IntoIterator<Item = S>,
        callback: impl Fn(GameEvent) + Send + 'static,
    ) -> anyhow::Result<GameProcess>
    where
        S: AsRef<OsStr>,
    {
        let c = Command::new(exe.as_ref().as_os_str())
            .current_dir(wd)
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("SHADPS4_ENABLE_IPC", "true")
            .spawn()?;

        let pid = c.id().expect("failed to get process id");

        let data = ProcessData {
            log_data: Arc::new(Mutex::new(LogData::new())),
        };

        let (sender, inner_sender) =
            Self::handle_events(c, app_handle.clone(), callback, data.clone()).await;

        let process = GameProcess {
            pid,
            sender: Arc::new(Mutex::new(sender)),
            inner_sender: Arc::new(Mutex::new(inner_sender)),
            data,
        };

        let state = app_handle.state::<GameBridgeStateType>();
        let mut state = state.lock().await;
        state.process_list.insert(pid, process.clone());
        drop(state);

        Ok(process)
    }
}

impl GameProcess {
    pub fn pid(&self) -> u32 {
        self.pid
    }

    pub fn data(&self) -> &ProcessData {
        &self.data
    }

    pub async fn kill(&self) -> anyhow::Result<()> {
        let inner_sender = self.inner_sender.lock().await;
        inner_sender
            .send(InnerCommand::Kill)
            .await
            .context("receiver is closed")?;
        Ok(())
    }

    pub async fn send(&self, value: &str) -> anyhow::Result<()> {
        let sender = self.sender.lock().await;
        sender
            .send(value.to_string())
            .await
            .context("failed to send command to the game process")?;
        Ok(())
    }

    async fn handle_events(
        mut c: Child,
        app_handle: AppHandle,
        callback: impl Fn(GameEvent) + Send + 'static,
        data: ProcessData,
    ) -> (Sender<String>, Sender<InnerCommand>) {
        let (tx, mut rx) = channel::<String>(1);
        let (inner_tx, mut inner_rx) = channel::<InnerCommand>(1);

        // let pid = c.id().expect("failed to get process id");

        tauri::async_runtime::spawn(async move {
            let mut stdin = c.stdin.take().expect("stdin is piped");

            let stdout = c.stdout.take().expect("stdout is piped");
            let stdout = BufReader::new(stdout);
            let mut stdout_lines = stdout.lines();

            let stderr = c.stderr.take().expect("stderr is piped");
            let stderr = BufReader::new(stderr);
            let mut stderr_lines = stderr.lines();

            let mut io_err: Option<anyhow::Error> = None;

            loop {
                tokio::select! {
                    msg = stdout_lines.next_line() => {
                       match msg {
                            Err(_) => {
                                io_err = Some(msg.context("failed to read stdout").unwrap_err());
                                break;
                            }
                            Ok(None) => break,
                            Ok(Some(line)) => {
                                let mut log_data = data.log_data.lock().await;
                                let (entry, new_class) = log_data.parse_entry(&line).unwrap_or_else(|| {
                                    (Entry {
                                        time: OffsetDateTime::now_utc(),
                                        level: log::Level::Info,
                                        class: "UNK",
                                        message: line,
                                    }, false)
                                });
                                if new_class {
                                    callback(GameEvent::AddLogClass{ value: entry.class })
                                }
                                let (row_id, entry) = log_data.add_entry(entry);
                                callback(GameEvent::Log ((
                                    row_id,
                                    entry,
                                ).into()));
                            },
                        }
                    }
                    msg = stderr_lines.next_line() => {
                       match msg {
                            Err(_) => {
                                io_err = Some(msg.context("failed to read stderr").unwrap_err());
                                break;
                            }
                            Ok(None) => break,
                            Ok(Some(line)) => {
                                if line.starts_with(';') {
                                    callback(GameEvent::IpcLine {
                                        value: &line[1..],
                                    });
                                    continue;
                                }
                                let mut log_data = data.log_data.lock().await;
                                let entry = Entry {
                                    time: OffsetDateTime::now_utc(),
                                    level: log::Level::Error,
                                    class: "STDERR",
                                    message: line,
                                };
                                let (row_id, entry) = log_data.add_entry(entry);
                                callback(GameEvent::Log ((
                                    row_id,
                                    entry,
                                ).into()));
                            },
                        }
                    }
                    _ = c.wait() => {
                       break;
                    }
                    Some(cmd) = rx.recv() => {
                        let r = stdin.write_all(cmd.as_bytes()).await.context("failed to write to stdin");
                        if let Err(err) = r {
                            io_err = Some(err);
                            break;
                        }
                        let _ = stdin.write_u8(b'\n').await;
                        let r = stdin.flush().await.context("failed to flush stdin");
                        if let Err(err) = r {
                            io_err = Some(err);
                            break;
                        }
                    }
                    Some(inner_cmd) = inner_rx.recv() => {
                        match inner_cmd {
                            InnerCommand::Kill => break,
                        };
                    }
                }
            }

            if let Some(err) = io_err {
                callback(GameEvent::IOError {
                    err: err.to_string(),
                })
            }

            c.start_kill().expect("could not kill a child process");
            let status = c
                .wait()
                .await
                .expect("could not read the exit status code")
                .code()
                .unwrap_or(-1);
            callback(GameEvent::GameExit { status });
        });

        (tx, inner_tx)
    }
}
