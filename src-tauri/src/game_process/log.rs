use regex::Regex;
use serde::Serialize;
use std::cell::RefCell;
use std::collections::{BTreeMap, HashMap, HashSet};
use time::UtcDateTime;

#[derive(Copy, Clone, Default, Hash, Eq, PartialEq, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Level {
    #[default]
    Unknown,
    Trace,
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Serialize, Clone)]
pub struct Entry {
    pub time: UtcDateTime,
    pub level: Level,
    pub class: &'static str,
    pub message: String,
}

pub type RowId = u32;

pub struct LogData {
    rows: BTreeMap<RowId, Entry>,
    index_level: HashMap<Level, HashSet<RowId>>,
    last_id: RowId,

    class_cache: RefCell<HashMap<String, &'static str>>, // This contains leaked data
}

thread_local! {
    static ENTRY_REGEX: Regex = Regex::new(r"^\[(.*?)]\s?<.*?>\s?(.*)$").unwrap()
}

impl LogData {
    pub fn new() -> Self {
        Self {
            rows: BTreeMap::new(),
            index_level: HashMap::new(),
            last_id: 0,
            class_cache: RefCell::new(HashMap::new()),
        }
    }

    pub fn parse_entry(&self, line: &str) -> Option<Entry> {
        let cap = ENTRY_REGEX.with(|rx| rx.captures(line))?;

        let class_raw = cap.get(1)?.as_str();
        let class = {
            let mut class_cache = self.class_cache.borrow_mut();
            if let Some(existing) = class_cache.get(class_raw) {
                *existing
            } else {
                let boxed: &'static str = Box::leak(class_raw.to_owned().into_boxed_str());
                class_cache.insert(class_raw.to_owned(), boxed);
                boxed
            }
        };
        let level = cap.get(2)?.as_str();
        let level = match level {
            "Trace" => Level::Trace,
            "Debug" => Level::Debug,
            "Info" => Level::Info,
            "Warning" => Level::Warning,
            "Error" => Level::Error,
            "Critical" => Level::Critical,
            _ => Level::Unknown,
        };

        let line = cap.get(3)?.as_str().to_owned();

        Some(Entry {
            time: UtcDateTime::now(),
            class,
            level,
            message: line,
        })
    }

    pub fn add_entry(&mut self, entry: Entry) -> RowId {
        let row_id = self.last_id;
        self.last_id += 1;
        let level = entry.level;
        self.rows.insert(row_id, entry);
        self.index_level.entry(level).or_default().insert(row_id);
        row_id
    }
}
