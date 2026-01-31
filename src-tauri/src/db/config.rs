use serde::{Deserialize, Serialize};
use super::connection::ConnectionManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostgresConfig {
    pub name: String,
    pub setting: String,
    pub unit: Option<String>,
    pub category: String,
    pub short_desc: Option<String>,
    pub source: String,
    pub min_val: Option<String>,
    pub max_val: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu_cores: i32,
    pub total_memory_mb: i64,
    pub postgres_version: String,
    pub os_type: String,
}

pub struct ConfigCollector;

impl ConfigCollector {
    pub async fn get_all_settings(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<PostgresConfig>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                name,
                setting,
                unit,
                category,
                short_desc,
                source,
                min_val,
                max_val
            FROM pg_settings
            ORDER BY category, name
        "#;

        let rows = client
            .query(query, &[])
            .await
            .map_err(|e| format!("Failed to query settings: {}", e))?;

        let settings = rows
            .iter()
            .map(|row| PostgresConfig {
                name: row.get(0),
                setting: row.get(1),
                unit: row.get(2),
                category: row.get(3),
                short_desc: row.get(4),
                source: row.get(5),
                min_val: row.get(6),
                max_val: row.get(7),
            })
            .collect();

        Ok(settings)
    }

    pub async fn get_hardware_info(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<HardwareInfo, String> {
        let client = manager.get_client(server_id).await?;

        // Get PostgreSQL version
        let version_row = client
            .query_one("SELECT version()", &[])
            .await
            .map_err(|e| format!("Failed to get version: {}", e))?;
        let version: String = version_row.get(0);

        // Try to get CPU count
        let cpu_query = "SELECT count(*) FROM pg_stat_activity WHERE state IS NOT NULL";
        let cpu_row = client
            .query_one(cpu_query, &[])
            .await
            .map_err(|e| format!("Failed to get CPU info: {}", e))?;
        let estimated_cores: i64 = cpu_row.get(0);

        // Try to estimate memory from settings
        let mem_query = "SELECT setting::bigint * 8 / 1024 FROM pg_settings WHERE name = 'shared_buffers'";
        let mem_row = client.query_one(mem_query, &[]).await;

        let total_memory_mb = match mem_row {
            Ok(row) => {
                let shared_buffers_mb: i64 = row.get(0);
                // Estimate total memory as 4x shared_buffers (rough heuristic)
                shared_buffers_mb * 4
            }
            Err(_) => 8192, // Default to 8GB if can't determine
        };

        Ok(HardwareInfo {
            cpu_cores: estimated_cores.max(1) as i32,
            total_memory_mb,
            postgres_version: version,
            os_type: "Linux".to_string(), // Simplified
        })
    }
}
