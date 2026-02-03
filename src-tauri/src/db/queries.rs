use super::connection::ConnectionManager;
use super::metrics::*;
use serde_json::Value;

pub struct MetricsCollector;

impl MetricsCollector {
    pub async fn get_database_stats(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<DatabaseStats>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                datname,
                numbackends,
                xact_commit,
                xact_rollback,
                blks_read,
                blks_hit,
                tup_returned,
                tup_fetched,
                tup_inserted,
                tup_updated,
                tup_deleted,
                conflicts,
                temp_files,
                temp_bytes,
                deadlocks
            FROM pg_stat_database
            WHERE datname NOT IN ('template0', 'template1')
        "#;

        let rows = client
            .query(query, &[])
            .await
            .map_err(|e| format!("Failed to query database stats: {}", e))?;

        let stats = rows
            .iter()
            .map(|row| DatabaseStats {
                datname: row.get(0),
                numbackends: row.get(1),
                xact_commit: row.get(2),
                xact_rollback: row.get(3),
                blks_read: row.get(4),
                blks_hit: row.get(5),
                tup_returned: row.get(6),
                tup_fetched: row.get(7),
                tup_inserted: row.get(8),
                tup_updated: row.get(9),
                tup_deleted: row.get(10),
                conflicts: row.get(11),
                temp_files: row.get(12),
                temp_bytes: row.get(13),
                deadlocks: row.get(14),
            })
            .collect();

        Ok(stats)
    }

    pub async fn get_top_queries(
        manager: &ConnectionManager,
        server_id: &str,
        limit: i32,
    ) -> Result<Vec<QueryStat>, String> {
        let client = manager.get_client(server_id).await?;

        // Check if pg_stat_statements extension exists
        let check_ext = client
            .query(
                "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'",
                &[],
            )
            .await
            .map_err(|e| format!("Failed to check pg_stat_statements: {}", e))?;

        if check_ext.is_empty() {
            // Return empty list instead of error when extension is not installed
            return Ok(vec![]);
        }

        let query = r#"
            SELECT
                query,
                calls,
                total_exec_time,
                mean_exec_time,
                min_exec_time,
                max_exec_time,
                rows,
                shared_blks_hit,
                shared_blks_read
            FROM pg_stat_statements
            ORDER BY total_exec_time DESC
            LIMIT $1
        "#;

        let rows = client
            .query(query, &[&(limit as i64)])
            .await
            .map_err(|e| format!("Failed to query pg_stat_statements: {}", e))?;

        let stats = rows
            .iter()
            .map(|row| QueryStat {
                query: row.get(0),
                calls: row.get(1),
                total_exec_time: row.get(2),
                mean_exec_time: row.get(3),
                min_exec_time: row.get(4),
                max_exec_time: row.get(5),
                rows: row.get(6),
                shared_blks_hit: row.get(7),
                shared_blks_read: row.get(8),
            })
            .collect();

        Ok(stats)
    }

    pub async fn get_active_queries(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<ActiveQuery>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                pid,
                usename,
                application_name,
                client_addr::text,
                backend_start::text,
                state,
                query,
                wait_event_type,
                wait_event
            FROM pg_stat_activity
            WHERE state != 'idle'
            AND pid != pg_backend_pid()
        "#;

        let rows = client
            .query(query, &[])
            .await
            .map_err(|e| format!("Failed to query active queries: {}", e))?;

        let queries = rows
            .iter()
            .map(|row| ActiveQuery {
                pid: row.get(0),
                usename: row.get(1),
                application_name: row.get(2),
                client_addr: row.get(3),
                backend_start: row.get(4),
                state: row.get(5),
                query: row.get(6),
                wait_event_type: row.get(7),
                wait_event: row.get(8),
            })
            .collect();

        Ok(queries)
    }

    pub async fn get_table_stats(
        manager: &ConnectionManager,
        server_id: &str,
        limit: i32,
    ) -> Result<Vec<TableStats>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                schemaname,
                relname,
                seq_scan,
                seq_tup_read,
                idx_scan,
                idx_tup_fetch,
                n_tup_ins,
                n_tup_upd,
                n_tup_del,
                n_live_tup,
                n_dead_tup,
                last_vacuum::text,
                last_autovacuum::text
            FROM pg_stat_user_tables
            ORDER BY seq_tup_read DESC
            LIMIT $1
        "#;

        let rows = client
            .query(query, &[&(limit as i64)])
            .await
            .map_err(|e| format!("Failed to query table stats: {}", e))?;

        let stats = rows
            .iter()
            .map(|row| TableStats {
                schemaname: row.get(0),
                relname: row.get(1),
                seq_scan: row.get(2),
                seq_tup_read: row.get(3),
                idx_scan: row.get(4),
                idx_tup_fetch: row.get(5),
                n_tup_ins: row.get(6),
                n_tup_upd: row.get(7),
                n_tup_del: row.get(8),
                n_live_tup: row.get(9),
                n_dead_tup: row.get(10),
                last_vacuum: row.get(11),
                last_autovacuum: row.get(12),
            })
            .collect();

        Ok(stats)
    }

    pub async fn get_index_stats(
        manager: &ConnectionManager,
        server_id: &str,
        limit: i32,
    ) -> Result<Vec<IndexStats>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                schemaname,
                relname as tablename,
                indexrelname as indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC
            LIMIT $1
        "#;

        let rows = client
            .query(query, &[&(limit as i64)])
            .await
            .map_err(|e| format!("Failed to query index stats: {}", e))?;

        let stats = rows
            .iter()
            .map(|row| IndexStats {
                schemaname: row.get(0),
                tablename: row.get(1),
                indexname: row.get(2),
                idx_scan: row.get(3),
                idx_tup_read: row.get(4),
                idx_tup_fetch: row.get(5),
            })
            .collect();

        Ok(stats)
    }

    pub async fn get_locks(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<LockInfo>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                locktype,
                database::regclass::text,
                relation::regclass::text,
                pid,
                mode,
                granted
            FROM pg_locks
            WHERE pid != pg_backend_pid()
        "#;

        let rows = client
            .query(query, &[])
            .await
            .map_err(|e| format!("Failed to query locks: {}", e))?;

        let locks = rows
            .iter()
            .map(|row| LockInfo {
                locktype: row.get(0),
                database: row.get(1),
                relation: row.get(2),
                pid: row.get(3),
                mode: row.get(4),
                granted: row.get(5),
            })
            .collect();

        Ok(locks)
    }

    pub async fn get_bgwriter_stats(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<BgWriterStats, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                checkpoints_timed,
                checkpoints_req,
                checkpoint_write_time,
                checkpoint_sync_time,
                buffers_checkpoint,
                buffers_clean,
                maxwritten_clean,
                buffers_backend,
                buffers_alloc
            FROM pg_stat_bgwriter
        "#;

        let row = client
            .query_one(query, &[])
            .await
            .map_err(|e| format!("Failed to query bgwriter stats: {}", e))?;

        Ok(BgWriterStats {
            checkpoints_timed: row.get(0),
            checkpoints_req: row.get(1),
            checkpoint_write_time: row.get(2),
            checkpoint_sync_time: row.get(3),
            buffers_checkpoint: row.get(4),
            buffers_clean: row.get(5),
            maxwritten_clean: row.get(6),
            buffers_backend: row.get(7),
            buffers_alloc: row.get(8),
        })
    }

    pub async fn get_database_sizes(
        manager: &ConnectionManager,
        server_id: &str,
    ) -> Result<Vec<DatabaseSize>, String> {
        let client = manager.get_client(server_id).await?;

        let query = r#"
            SELECT
                datname,
                size_bytes,
                pg_size_pretty(size_bytes)
            FROM (
                SELECT datname, pg_database_size(datname) as size_bytes
                FROM pg_database
                WHERE datname NOT IN ('template0', 'template1')
            ) sizes
            ORDER BY size_bytes DESC
        "#;

        let rows = client
            .query(query, &[])
            .await
            .map_err(|e| format!("Failed to query database sizes: {}", e))?;

        let sizes = rows
            .iter()
            .map(|row| DatabaseSize {
                database_name: row.get(0),
                size_bytes: row.get(1),
                size_pretty: row.get(2),
            })
            .collect();

        Ok(sizes)
    }

    pub async fn explain_query(
        manager: &ConnectionManager,
        server_id: &str,
        query: &str,
        analyze: bool,
    ) -> Result<ExplainPlan, String> {
        let client = manager.get_client(server_id).await?;

        // Validate query - only allow SELECT, INSERT, UPDATE, DELETE, WITH
        let trimmed = query.trim().to_uppercase();
        if !trimmed.starts_with("SELECT")
            && !trimmed.starts_with("INSERT")
            && !trimmed.starts_with("UPDATE")
            && !trimmed.starts_with("DELETE")
            && !trimmed.starts_with("WITH")
        {
            return Err("Only SELECT, INSERT, UPDATE, DELETE, or WITH queries can be explained".to_string());
        }

        // Build EXPLAIN command
        let explain_query = if analyze {
            format!("EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) {}", query)
        } else {
            format!("EXPLAIN (COSTS, VERBOSE, FORMAT JSON) {}", query)
        };

        let row = client
            .query_one(&explain_query, &[])
            .await
            .map_err(|e| format!("Failed to explain query: {}", e))?;

        let json_plan: Value = row.get(0);

        // Parse the JSON plan
        let plan_array = json_plan
            .as_array()
            .and_then(|arr| arr.first())
            .ok_or("Invalid EXPLAIN output format")?;

        let plan_obj = plan_array.as_object().ok_or("Invalid plan object")?;

        let planning_time = plan_obj.get("Planning Time").and_then(|v| v.as_f64());
        let execution_time = plan_obj.get("Execution Time").and_then(|v| v.as_f64());

        let root_plan = plan_obj.get("Plan").ok_or("Missing Plan in EXPLAIN output")?;
        let root_node = Self::parse_explain_node(root_plan)?;

        let total_cost = root_node.total_cost;
        let mut warnings = root_node.warnings.clone();
        Self::collect_warnings(&root_node, &mut warnings);

        Ok(ExplainPlan {
            query: query.to_string(),
            planning_time,
            execution_time,
            root: root_node,
            total_cost,
            warnings,
        })
    }

    fn parse_explain_node(node: &Value) -> Result<ExplainNode, String> {
        let obj = node.as_object().ok_or("Invalid node format")?;

        let node_type = obj.get("Node Type")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string();

        let relation_name = obj.get("Relation Name").and_then(|v| v.as_str()).map(String::from);
        let alias = obj.get("Alias").and_then(|v| v.as_str()).map(String::from);

        let startup_cost = obj.get("Startup Cost").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let total_cost = obj.get("Total Cost").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let plan_rows = obj.get("Plan Rows").and_then(|v| v.as_i64()).unwrap_or(0);
        let plan_width = obj.get("Plan Width").and_then(|v| v.as_i64()).unwrap_or(0);

        let actual_startup_time = obj.get("Actual Startup Time").and_then(|v| v.as_f64());
        let actual_total_time = obj.get("Actual Total Time").and_then(|v| v.as_f64());
        let actual_rows = obj.get("Actual Rows").and_then(|v| v.as_i64());
        let actual_loops = obj.get("Actual Loops").and_then(|v| v.as_i64());

        let filter = obj.get("Filter").and_then(|v| v.as_str()).map(String::from);
        let index_name = obj.get("Index Name").and_then(|v| v.as_str()).map(String::from);
        let index_cond = obj.get("Index Cond").and_then(|v| v.as_str()).map(String::from);
        let join_type = obj.get("Join Type").and_then(|v| v.as_str()).map(String::from);
        let hash_cond = obj.get("Hash Cond").and_then(|v| v.as_str()).map(String::from);

        let sort_key = obj.get("Sort Key").and_then(|v| {
            v.as_array().map(|arr| {
                arr.iter()
                    .filter_map(|item| item.as_str().map(String::from))
                    .collect()
            })
        });

        let shared_hit_blocks = obj.get("Shared Hit Blocks").and_then(|v| v.as_i64());
        let shared_read_blocks = obj.get("Shared Read Blocks").and_then(|v| v.as_i64());
        let workers_planned = obj.get("Workers Planned").and_then(|v| v.as_i64());
        let workers_launched = obj.get("Workers Launched").and_then(|v| v.as_i64());

        // Parse children
        let children: Vec<ExplainNode> = if let Some(plans) = obj.get("Plans") {
            plans.as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|child| Self::parse_explain_node(child).ok())
                        .collect()
                })
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        // Generate warnings
        let mut warnings = Vec::new();

        // Seq Scan warning
        if node_type == "Seq Scan" && plan_rows > 1000 {
            warnings.push(format!(
                "Sequential scan on {} with {} estimated rows - consider adding an index",
                relation_name.as_deref().unwrap_or("table"),
                plan_rows
            ));
        }

        // Row estimation mismatch warning
        if let (Some(actual), estimated) = (actual_rows, plan_rows) {
            let ratio = if estimated > 0 { actual as f64 / estimated as f64 } else { 1.0 };
            if ratio > 10.0 || ratio < 0.1 {
                warnings.push(format!(
                    "Row estimation mismatch: estimated {} vs actual {} rows",
                    estimated, actual
                ));
            }
        }

        // Nested Loop warning with high loops
        if node_type == "Nested Loop" {
            if let Some(loops) = actual_loops {
                if loops > 1000 {
                    warnings.push(format!(
                        "Nested Loop executed {} times - may indicate missing index or join optimization needed",
                        loops
                    ));
                }
            }
        }

        Ok(ExplainNode {
            node_type,
            relation_name,
            alias,
            startup_cost,
            total_cost,
            plan_rows,
            plan_width,
            actual_startup_time,
            actual_total_time,
            actual_rows,
            actual_loops,
            filter,
            index_name,
            index_cond,
            join_type,
            hash_cond,
            sort_key,
            shared_hit_blocks,
            shared_read_blocks,
            workers_planned,
            workers_launched,
            children,
            warnings,
        })
    }

    fn collect_warnings(node: &ExplainNode, warnings: &mut Vec<String>) {
        for child in &node.children {
            warnings.extend(child.warnings.clone());
            Self::collect_warnings(child, warnings);
        }
    }
}
