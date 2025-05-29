use regex::Regex;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::{btree_map, BTreeMap, HashMap};
use time::OffsetDateTime;

#[derive(Copy, Clone, Default, Hash, Eq, PartialEq, Debug, Serialize, Deserialize)]
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

pub type RowId = u32;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub time: OffsetDateTime,
    pub level: Level,
    pub class: &'static str,
    pub message: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry<'a> {
    pub row_id: RowId,
    #[serde(with = "time::serde::timestamp")]
    pub time: OffsetDateTime,
    pub level: Level,
    pub class: &'a str,
    pub message: &'a str,
}

pub struct LogData {
    pub rows: BTreeMap<RowId, Entry>,
    last_id: RowId,
    class_cache: RefCell<HashMap<String, &'static str>>, // This contains leaked data
}

thread_local! {
    static ENTRY_REGEX: Regex = Regex::new(r"^\[(.*?)]\s?<(.*?)>\s?(.*)$").unwrap()
}

impl LogData {
    pub fn new() -> Self {
        Self {
            rows: BTreeMap::new(),
            last_id: 0,
            class_cache: RefCell::new(HashMap::new()),
        }
    }

    /// returns: Option<(Entry, bool)> If a line is parsed successfully,
    /// it returns the LogEntry and a boolean indicating if this is a new class
    pub fn parse_entry(&self, line: &str) -> Option<(Entry, bool)> {
        let cap = ENTRY_REGEX.with(|rx| rx.captures(line))?;

        let mut new_class = false;
        let class_raw = cap.get(1)?.as_str();
        let class = {
            let mut class_cache = self.class_cache.borrow_mut();
            if let Some(existing) = class_cache.get(class_raw) {
                *existing
            } else {
                let boxed: &'static str = Box::leak(class_raw.to_owned().into_boxed_str());
                class_cache.insert(class_raw.to_owned(), boxed);
                new_class = true;
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

        Some((
            Entry {
                time: OffsetDateTime::now_utc(),
                class,
                level,
                message: line,
            },
            new_class,
        ))
    }

    pub fn add_entry<'a>(&'a mut self, entry: Entry) -> (RowId, &'a Entry) {
        let row_id = self.last_id;
        self.last_id += 1;
        let row_entry = self.rows.entry(row_id);
        let r: &'a Entry = match row_entry {
            btree_map::Entry::Vacant(e) => e.insert(entry),
            btree_map::Entry::Occupied(_) => {
                panic!("we shouldn't be replacing rows")
            }
        };
        (row_id, r)
    }
}

impl<'a> From<(RowId, &'a Entry)> for LogEntry<'a> {
    fn from(value: (RowId, &'a Entry)) -> Self {
        let (id, entry) = value;
        Self {
            row_id: id,
            time: entry.time,
            level: entry.level,
            class: entry.class,
            message: &entry.message,
        }
    }
}
