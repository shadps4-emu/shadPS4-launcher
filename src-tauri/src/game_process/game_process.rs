use crate::game_process::log::{Entry, LogData, LogEntry};
use crate::game_process::{GameBridgeStateType, log};
use anyhow::Context;
use serde::Serialize;
use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use tauri::async_runtime::Mutex;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager};
use time::OffsetDateTime;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc::{Sender, channel};

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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningProcessInfo {
    pub pid: u32,
    pub exe: String,
    pub wd: String,
    pub args: Vec<String>,
    pub ipc_ready: bool,
    pub capabilities: Vec<String>,
}

type EventChannel = Arc<StdMutex<Option<Channel<GameEvent<'static>>>>>;

#[derive(Clone)]
pub struct GameProcess {
    pid: u32,
    exe: String,
    wd: String,
    args: Vec<String>,
    data: ProcessData,

    sender: Arc<Mutex<Sender<String>>>, // These are commands sent to the emulator
    inner_sender: Arc<Mutex<Sender<InnerCommand>>>, // These are commands sent to the launcher
    on_event: EventChannel,
}

#[derive(Clone)]
pub struct ProcessData {
    pub log_data: Arc<Mutex<LogData>>,
    pub ipc_ready: Arc<AtomicBool>,
    pub capabilities: Arc<StdMutex<Vec<String>>>,
}

fn emit_event(on_event: &EventChannel, ev: GameEvent<'_>) {
    if let Ok(guard) = on_event.lock() {
        if let Some(ch) = guard.as_ref() {
            let _ = ch.send(ev);
        }
    }
}

pub fn is_process_alive(pid: u32) -> bool {
    #[cfg(unix)]
    {
        std::process::Command::new("kill")
            .args(["-0", &pid.to_string()])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        std::process::Command::new("tasklist")
            .args(["/FI", &format!("PID eq {pid}"), "/NH"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).contains(&pid.to_string()))
            .unwrap_or(false)
    }
}

impl GameProcess {
    pub async fn start(
        app_handle: &AppHandle,
        exe: impl AsRef<Path>,
        wd: impl AsRef<Path>,
        args: Vec<String>,
        on_event: Channel<GameEvent<'static>>,
        data: Option<ProcessData>,
    ) -> anyhow::Result<GameProcess> {
        let c = Command::new(exe.as_ref().as_os_str())
            .current_dir(&wd)
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("SHADPS4_ENABLE_IPC", "true")
            .spawn()?;

        let pid = c.id().expect("failed to get process id");

        let data = data.unwrap_or_else(|| ProcessData {
            log_data: Arc::new(Mutex::new(LogData::new())),
            ipc_ready: Arc::new(AtomicBool::new(false)),
            capabilities: Arc::new(StdMutex::new(Vec::new())),
        });

        let on_event_storage: EventChannel = Arc::new(StdMutex::new(Some(on_event)));
        let on_event_for_callback = on_event_storage.clone();

        let (sender, inner_sender) = Self::handle_events(
            c,
            app_handle.clone(),
            pid,
            move |ev| emit_event(&on_event_for_callback, ev),
            data.clone(),
        )
        .await;

        let process = GameProcess {
            pid,
            exe: exe.as_ref().to_string_lossy().into_owned(),
            wd: wd.as_ref().to_string_lossy().into_owned(),
            args,
            sender: Arc::new(Mutex::new(sender)),
            inner_sender: Arc::new(Mutex::new(inner_sender)),
            data,
            on_event: on_event_storage,
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

    pub fn info(&self) -> RunningProcessInfo {
        RunningProcessInfo {
            pid: self.pid,
            exe: self.exe.clone(),
            wd: self.wd.clone(),
            args: self.args.clone(),
            ipc_ready: self.data.ipc_ready.load(Ordering::Relaxed),
            capabilities: self
                .data
                .capabilities
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .clone(),
        }
    }

    pub fn attach_event_channel(&self, on_event: Channel<GameEvent<'static>>) {
        if let Ok(mut guard) = self.on_event.lock() {
            *guard = Some(on_event);
        }
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
        pid: u32,
        callback: impl Fn(GameEvent) + Send + 'static,
        data: ProcessData,
    ) -> (Sender<String>, Sender<InnerCommand>) {
        let (tx, mut rx) = channel::<String>(1);
        let (inner_tx, mut inner_rx) = channel::<InnerCommand>(1);

        tauri::async_runtime::spawn(async move {
            let mut stdin = c.stdin.take().expect("stdin is piped");
            let mut reading_ipc_capabilities = false;

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
                                    let value = &line[1..];
                                    if value == "#IPC_ENABLED" {
                                        reading_ipc_capabilities = true;
                                    } else if value == "#IPC_END" {
                                        reading_ipc_capabilities = false;
                                        data.ipc_ready.store(true, Ordering::Relaxed);
                                    } else if reading_ipc_capabilities {
                                        if let Ok(mut capabilities) =
                                            data.capabilities.lock()
                                        {
                                            capabilities.push(value.to_owned());
                                        }
                                    }
                                    callback(GameEvent::IpcLine { value });
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

            let state = app_handle.state::<GameBridgeStateType>();
            let mut state = state.lock().await;
            state.process_list.remove(&pid);
        });

        (tx, inner_tx)
    }
}
