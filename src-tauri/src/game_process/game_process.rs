use crate::game_process::ipc::GameCommand;
use crate::game_process::GameBridgeStateType;
use anyhow::Context;
use serde::Serialize;
use std::path::Path;
use std::process::Stdio;
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc::{channel, Sender};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event")]
pub enum GameEvent {
    LogLine { line: String },
    ErrLogLine { line: String },
    GameExit { status: i32 },
    IOError { err: String },
}

enum InnerCommand {
    Kill,
}

#[derive(Clone)]
pub struct GameProcess {
    pid: u32,
    #[allow(dead_code)]
    sender: Arc<Mutex<Sender<GameCommand>>>,
    inner_sender: Arc<Mutex<Sender<InnerCommand>>>,
}

impl GameProcess {
    pub async fn start(
        app_handle: &AppHandle,
        exe: impl AsRef<Path>,
        wd: impl AsRef<Path>,
        game: impl AsRef<Path>,
        callback: impl Fn(GameEvent) + Send + 'static,
    ) -> anyhow::Result<GameProcess> {
        let c = Command::new(exe.as_ref().as_os_str())
            .current_dir(wd)
            .arg(game.as_ref().as_os_str())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        let pid = c.id().expect("failed to get process id");
        let (sender, inner_sender) = Self::handle_events(c, app_handle.clone(), callback).await;

        let process = GameProcess {
            pid,
            sender: Arc::new(Mutex::new(sender)),
            inner_sender: Arc::new(Mutex::new(inner_sender)),
        };

        let state = app_handle.state::<GameBridgeStateType>();
        state.lock().await.process_list.insert(pid, process.clone());

        Ok(process)
    }

    pub fn pid(&self) -> u32 {
        self.pid
    }

    pub async fn kill(&self) {
        let inner_sender = self.inner_sender.lock().await;
        inner_sender
            .send(InnerCommand::Kill)
            .await
            .expect("receiver is closed");
    }

    async fn handle_events(
        c: Child,
        app_handle: AppHandle,
        callback: impl Fn(GameEvent) + Send + 'static,
    ) -> (Sender<GameCommand>, Sender<InnerCommand>) {
        let (tx, rx) = channel::<GameCommand>(1);
        let (inner_tx, inner_rx) = channel::<InnerCommand>(1);

        let pid = c.id().expect("failed to get process id");

        tauri::async_runtime::spawn(async move {
            let mut rx = rx;
            let mut inner_rx = inner_rx;
            let mut c = c;

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
                            Ok(Some(line)) => callback(GameEvent::LogLine { line }),
                        }
                    }
                    msg = stderr_lines.next_line() => {
                       match msg {
                            Err(_) => {
                                io_err = Some(msg.context("failed to read stderr").unwrap_err());
                                break;
                            }
                            Ok(None) => break,
                            Ok(Some(line)) => callback(GameEvent::ErrLogLine { line }),
                        }
                    }
                    _ = c.wait() => {
                       break;
                    }
                    Some(cmd) = rx.recv() => {
                        let line = cmd.gen_command_line();
                        let r = stdin.write_all(line.as_bytes()).await.context("failed to write to stdin");
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
                };
            }

            if let Some(err) = io_err {
                callback(GameEvent::IOError {
                    err: err.to_string(),
                })
            }

            c.start_kill().expect("could not kill child process");
            let status = c
                .wait()
                .await
                .expect("could not read exit status code")
                .code()
                .unwrap_or(-1);
            callback(GameEvent::GameExit { status });

            let state = app_handle.state::<GameBridgeStateType>();
            state.lock().await.process_list.remove(&pid);
        });

        (tx, inner_tx)
    }
}
