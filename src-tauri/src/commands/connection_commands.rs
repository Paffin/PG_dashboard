use crate::db::{ConnectionConfig, ConnectionManager, ConnectionTestResult, ServerInfo};
use tauri::State;

#[tauri::command]
pub async fn test_connection(
    config: ConnectionConfig,
    manager: State<'_, ConnectionManager>,
) -> Result<ConnectionTestResult, String> {
    Ok(manager.test_connection(&config).await)
}

#[tauri::command]
pub async fn add_server(
    config: ConnectionConfig,
    manager: State<'_, ConnectionManager>,
) -> Result<(), String> {
    manager.add_connection(config).await
}

#[tauri::command]
pub async fn remove_server(
    id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<(), String> {
    manager.remove_connection(&id).await
}

#[tauri::command]
pub fn get_server_info(
    id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Option<ServerInfo>, String> {
    Ok(manager.get_server_info(&id))
}

#[tauri::command]
pub fn list_servers(
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<ServerInfo>, String> {
    Ok(manager.list_servers())
}
