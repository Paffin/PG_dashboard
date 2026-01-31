use serde::{Deserialize, Serialize};
use super::connection::ConnectionManager;
use super::config::{ConfigCollector, HardwareInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigIssue {
    pub parameter: String,
    pub current_value: String,
    pub recommended_value: String,
    pub severity: IssueSeverity,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceIssue {
    pub issue_type: String,
    pub severity: IssueSeverity,
    pub description: String,
    pub recommendation: String,
    pub details: Option<String>,
}

pub struct ConfigAnalyzer;

impl ConfigAnalyzer {
    pub async fn analyze_configuration(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<ConfigIssue>, String> {
        let settings = ConfigCollector::get_all_settings(manager, server_id).await?;
        let hardware = ConfigCollector::get_hardware_info(manager, server_id).await?;

        let mut issues = Vec::new();

        // Analyze shared_buffers
        if let Some(shared_buffers) = settings.iter().find(|s| s.name == "shared_buffers") {
            issues.extend(Self::analyze_shared_buffers(&shared_buffers.setting, &hardware));
        }

        // Analyze effective_cache_size
        if let Some(ecs) = settings.iter().find(|s| s.name == "effective_cache_size") {
            issues.extend(Self::analyze_effective_cache_size(&ecs.setting, &hardware));
        }

        // Analyze work_mem
        if let Some(work_mem) = settings.iter().find(|s| s.name == "work_mem") {
            issues.extend(Self::analyze_work_mem(&work_mem.setting, &hardware));
        }

        // Analyze max_connections
        if let Some(max_conn) = settings.iter().find(|s| s.name == "max_connections") {
            issues.extend(Self::analyze_max_connections(&max_conn.setting, &hardware));
        }

        Ok(issues)
    }

    fn analyze_shared_buffers(current: &str, hardware: &HardwareInfo) -> Vec<ConfigIssue> {
        let mut issues = Vec::new();

        // Parse current value (assuming it's in 8kB blocks)
        if let Ok(current_blocks) = current.parse::<i64>() {
            let current_mb = current_blocks * 8 / 1024;
            let recommended_mb = (hardware.total_memory_mb as f64 * 0.25).min(8192.0) as i64;

            if current_mb < recommended_mb / 2 {
                issues.push(ConfigIssue {
                    parameter: "shared_buffers".to_string(),
                    current_value: format!("{}MB", current_mb),
                    recommended_value: format!("{}MB", recommended_mb),
                    severity: IssueSeverity::Warning,
                    reason: "shared_buffers is too low. Recommended: 25% of RAM (max 8GB)".to_string(),
                });
            }
        }

        issues
    }

    fn analyze_effective_cache_size(current: &str, hardware: &HardwareInfo) -> Vec<ConfigIssue> {
        let mut issues = Vec::new();

        if let Ok(current_blocks) = current.parse::<i64>() {
            let current_mb = current_blocks * 8 / 1024;
            let recommended_mb = (hardware.total_memory_mb as f64 * 0.75) as i64;

            if current_mb < recommended_mb / 2 {
                issues.push(ConfigIssue {
                    parameter: "effective_cache_size".to_string(),
                    current_value: format!("{}MB", current_mb),
                    recommended_value: format!("{}MB", recommended_mb),
                    severity: IssueSeverity::Info,
                    reason: "effective_cache_size is low. Recommended: 50-75% of total RAM".to_string(),
                });
            }
        }

        issues
    }

    fn analyze_work_mem(current: &str, _hardware: &HardwareInfo) -> Vec<ConfigIssue> {
        let mut issues = Vec::new();

        if let Ok(current_kb) = current.parse::<i64>() {
            let current_mb = current_kb / 1024;

            if current_mb < 4 {
                issues.push(ConfigIssue {
                    parameter: "work_mem".to_string(),
                    current_value: format!("{}MB", current_mb),
                    recommended_value: "10-50MB".to_string(),
                    severity: IssueSeverity::Info,
                    reason: "work_mem is very low, may affect sort and hash operations".to_string(),
                });
            }
        }

        issues
    }

    fn analyze_max_connections(current: &str, hardware: &HardwareInfo) -> Vec<ConfigIssue> {
        let mut issues = Vec::new();

        if let Ok(max_conn) = current.parse::<i32>() {
            let recommended = (hardware.cpu_cores * 50).min(200);

            if max_conn > recommended * 2 {
                issues.push(ConfigIssue {
                    parameter: "max_connections".to_string(),
                    current_value: max_conn.to_string(),
                    recommended_value: recommended.to_string(),
                    severity: IssueSeverity::Warning,
                    reason: "max_connections is very high, may cause resource exhaustion".to_string(),
                });
            }
        }

        issues
    }

    pub async fn detect_performance_issues(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<PerformanceIssue>, String> {
        let mut issues = Vec::new();

        // Check cache hit ratio
        let client = manager.get_client(server_id).await?;

        let cache_query = r#"
            SELECT
                sum(blks_hit)::float / NULLIF(sum(blks_hit + blks_read), 0) * 100 as cache_hit_ratio
            FROM pg_stat_database
        "#;

        if let Ok(row) = client.query_one(cache_query, &[]).await {
            let ratio: Option<f64> = row.get(0);
            if let Some(r) = ratio {
                if r < 90.0 {
                    issues.push(PerformanceIssue {
                        issue_type: "Low Cache Hit Ratio".to_string(),
                        severity: IssueSeverity::Critical,
                        description: format!("Cache hit ratio is {:.2}%, should be > 90%", r),
                        recommendation: "Increase shared_buffers or investigate query patterns".to_string(),
                        details: None,
                    });
                }
            }
        }

        // Check for tables with high sequential scans
        let seq_scan_query = r#"
            SELECT schemaname, relname, seq_scan, seq_tup_read
            FROM pg_stat_user_tables
            WHERE seq_scan > 1000 AND seq_tup_read > 100000
            ORDER BY seq_tup_read DESC
            LIMIT 5
        "#;

        if let Ok(rows) = client.query(seq_scan_query, &[]).await {
            for row in rows {
                let schema: String = row.get(0);
                let table: String = row.get(1);
                let seq_scan: i64 = row.get(2);

                issues.push(PerformanceIssue {
                    issue_type: "High Sequential Scans".to_string(),
                    severity: IssueSeverity::Warning,
                    description: format!("Table {}.{} has {} sequential scans", schema, table, seq_scan),
                    recommendation: "Consider adding indexes to reduce sequential scans".to_string(),
                    details: Some(format!("Table: {}.{}", schema, table)),
                });
            }
        }

        // Check for unused indexes
        let unused_index_query = r#"
            SELECT schemaname, tablename, indexname
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0 AND indexrelname NOT LIKE '%_pkey'
            LIMIT 10
        "#;

        if let Ok(rows) = client.query(unused_index_query, &[]).await {
            for row in rows {
                let schema: String = row.get(0);
                let table: String = row.get(1);
                let index: String = row.get(2);

                issues.push(PerformanceIssue {
                    issue_type: "Unused Index".to_string(),
                    severity: IssueSeverity::Info,
                    description: format!("Index {} on {}.{} is never used", index, schema, table),
                    recommendation: "Consider dropping unused indexes to improve write performance".to_string(),
                    details: Some(format!("Index: {}", index)),
                });
            }
        }

        Ok(issues)
    }
}
