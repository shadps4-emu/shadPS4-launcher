// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let _ = dotenvy::dotenv_override();

    shadps4_launcher_lib::run()
}
