use super::connection::ConnectionManager;
use super::metrics::*;

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
            return Err("pg_stat_statements extension is not installed".to_string());
        }

        let query = format!(
            r#"
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
            LIMIT {}
        "#,
            limit
        );

        let rows = client
            .query(&query, &[])
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

        let query = format!(
            r#"
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
            LIMIT {}
        "#,
            limit
        );

        let rows = client
            .query(&query, &[])
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

        let query = format!(
            r#"
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC
            LIMIT {}
        "#,
            limit
        );

        let rows = client
            .query(&query, &[])
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
                pg_database_size(datname),
                pg_size_pretty(pg_database_size(datname))
            FROM pg_database
            WHERE datname NOT IN ('template0', 'template1')
            ORDER BY pg_database_size(datname) DESC
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
}
