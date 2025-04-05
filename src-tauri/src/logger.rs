use log::LevelFilter;
use std::env;
use tauri::plugin::TauriPlugin;
use tauri::Runtime;
use tauri_plugin_log::fern::colors::{Color, ColoredLevelConfig};
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

#[derive(Debug)]
pub(crate) struct Directive {
    pub(crate) name: Option<String>,
    pub(crate) level: LevelFilter,
}

#[derive(Default, Debug)]
struct ParseResult {
    pub directives: Vec<Directive>,
    pub errors: Vec<String>,
}

// from env_logger crate
fn parse_spec(spec: &str) -> ParseResult {
    let mut result = ParseResult::default();

    for s in spec.split(',').map(|ss| ss.trim()) {
        if s.is_empty() {
            continue;
        }
        let mut parts = s.split('=');
        let (log_level, name) = match (parts.next(), parts.next().map(|s| s.trim()), parts.next()) {
            (Some(part0), None, None) => {
                // if the single argument is a log-level string or number,
                // treat that as a global fallback
                match part0.parse() {
                    Ok(num) => (num, None),
                    Err(_) => (LevelFilter::max(), Some(part0)),
                }
            }
            (Some(part0), Some(""), None) => (LevelFilter::max(), Some(part0)),
            (Some(part0), Some(part1), None) => {
                if let Ok(num) = part1.parse() {
                    (num, Some(part0))
                } else {
                    result
                        .errors
                        .push(format!("invalid logging spec '{}'", part1));
                    continue;
                }
            }
            _ => {
                result.errors.push(format!("invalid logging spec '{}'", s));
                continue;
            }
        };

        result.directives.push(Directive {
            name: name.map(|s| s.to_owned()),
            level: log_level,
        });
    }

    result
}

pub fn build_log_plugin<R: Runtime>() -> TauriPlugin<R> {
    let mut log_plugin = tauri_plugin_log::Builder::new()
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
        .rotation_strategy(RotationStrategy::KeepAll)
        .max_file_size(1024 * 1024 * 32) // 32MB
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
            Target::new(TargetKind::Webview),
        ])
        .level(LevelFilter::Info)
        .with_colors(
            ColoredLevelConfig::new()
                .trace(Color::Cyan)
                .debug(Color::Blue)
                .info(Color::Green)
                .warn(Color::Yellow)
                .error(Color::BrightRed),
        );
    if cfg!(debug_assertions) {
        log_plugin = log_plugin.level(LevelFilter::Debug);
    }

    // Remove common Tauri warning
    log_plugin = log_plugin.level_for(
        "tao::platform_impl::platform::event_loop::runner",
        LevelFilter::Error,
    );

    let r = parse_spec(env::var("SHADPS4_LOG").unwrap_or_default().as_str());
    for error in r.errors {
        eprintln!("warning: {error}, ignoring it");
    }

    for directive in r.directives {
        if let Some(name) = directive.name {
            log_plugin = log_plugin.level_for(name, directive.level)
        } else {
            log_plugin = log_plugin.level(directive.level)
        }
    }

    log_plugin.build()
}
