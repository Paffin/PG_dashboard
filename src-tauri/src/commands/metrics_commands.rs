use crate::db::{
    ConnectionManager, MetricsCollector, DatabaseStats, QueryStat,
    ActiveQuery, TableStats, IndexStats, LockInfo, BgWriterStats, DatabaseSize,
};
use tauri::State;

#[tauri::command]
pub async fn get_database_stats(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<DatabaseStats>, String> {
    MetricsCollector::get_database_stats(&manager, &server_id).await
}

#[tauri::command]
pub async fn get_top_queries(
    server_id: String,
    limit: i32,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<QueryStat>, String> {
    MetricsCollector::get_top_queries(&manager, &server_id, limit).await
}

#[tauri::command]
pub async fn get_active_queries(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<ActiveQuery>, String> {
    MetricsCollector::get_active_queries(&manager, &server_id).await
}

#[tauri::command]
pub async fn get_table_stats(
    server_id: String,
    limit: i32,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<TableStats>, String> {
    MetricsCollector::get_table_stats(&manager, &server_id, limit).await
}

#[tauri::command]
pub async fn get_index_stats(
    server_id: String,
    limit: i32,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<IndexStats>, String> {
    MetricsCollector::get_index_stats(&manager, &server_id, limit).await
}

#[tauri::command]
pub async fn get_locks(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<LockInfo>, String> {
    MetricsCollector::get_locks(&manager, &server_id).await
}

#[tauri::command]
pub async fn get_bgwriter_stats(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<BgWriterStats, String> {
    MetricsCollector::get_bgwriter_stats(&manager, &server_id).await
}

#[tauri::command]
pub async fn get_database_sizes(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<DatabaseSize>, String> {
    MetricsCollector::get_database_sizes(&manager, &server_id).await
}
