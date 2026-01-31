use crate::db::{ConnectionManager, ConfigCollector, PostgresConfig, HardwareInfo};
use tauri::State;

#[tauri::command]
pub async fn get_all_settings(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<PostgresConfig>, String> {
    ConfigCollector::get_all_settings(&manager, &server_id).await
}

#[tauri::command]
pub async fn get_hardware_info(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<HardwareInfo, String> {
    ConfigCollector::get_hardware_info(&manager, &server_id).await
}
