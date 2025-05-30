use tauri_plugin_sql::{Migration, MigrationKind};

pub fn gen_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create game list",
            // language=sqlite
            sql: r#"CREATE TABLE games
(
    id         INTEGER PRIMARY KEY,
    path       TEXT NOT NULL,
    cusa       TEXT NOT NULL,
    title      TEXT NOT NULL,
    version    TEXT NOT NULL,
    fw_version TEXT NOT NULL,
    sfo_json   BLOB
);
CREATE UNIQUE INDEX games_path_idx ON games (path);
"#,
            kind: MigrationKind::Up,
        }
    ]
}