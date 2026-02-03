mod db;
mod commands;

use db::ConnectionManager;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let connection_manager = ConnectionManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(connection_manager)
        .invoke_handler(tauri::generate_handler![
            test_connection,
            add_server,
            remove_server,
            get_server_info,
            list_servers,
            reconnect_server,
            get_database_stats,
            get_top_queries,
            get_active_queries,
            get_table_stats,
            get_index_stats,
            get_locks,
            get_bgwriter_stats,
            get_database_sizes,
            get_all_settings,
            get_hardware_info,
            analyze_configuration,
            detect_performance_issues,
            explain_query,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
