use crate::db::{ConnectionManager, ConfigAnalyzer, ConfigIssue, PerformanceIssue};
use tauri::State;

#[tauri::command]
pub async fn analyze_configuration(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<ConfigIssue>, String> {
    ConfigAnalyzer::analyze_configuration(&manager, &server_id).await
}

#[tauri::command]
pub async fn detect_performance_issues(
    server_id: String,
    manager: State<'_, ConnectionManager>,
) -> Result<Vec<PerformanceIssue>, String> {
    ConfigAnalyzer::detect_performance_issues(&manager, &server_id).await
}
