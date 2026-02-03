use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub datname: String,
    pub numbackends: i32,
    pub xact_commit: i64,
    pub xact_rollback: i64,
    pub blks_read: i64,
    pub blks_hit: i64,
    pub tup_returned: i64,
    pub tup_fetched: i64,
    pub tup_inserted: i64,
    pub tup_updated: i64,
    pub tup_deleted: i64,
    pub conflicts: i64,
    pub temp_files: i64,
    pub temp_bytes: i64,
    pub deadlocks: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryStat {
    pub query: String,
    pub calls: i64,
    pub total_exec_time: f64,
    pub mean_exec_time: f64,
    pub min_exec_time: f64,
    pub max_exec_time: f64,
    pub rows: i64,
    pub shared_blks_hit: i64,
    pub shared_blks_read: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveQuery {
    pub pid: i32,
    pub usename: String,
    pub application_name: String,
    pub client_addr: Option<String>,
    pub backend_start: String,
    pub state: String,
    pub query: String,
    pub wait_event_type: Option<String>,
    pub wait_event: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableStats {
    pub schemaname: String,
    pub relname: String,
    pub seq_scan: i64,
    pub seq_tup_read: i64,
    pub idx_scan: Option<i64>,
    pub idx_tup_fetch: Option<i64>,
    pub n_tup_ins: i64,
    pub n_tup_upd: i64,
    pub n_tup_del: i64,
    pub n_live_tup: i64,
    pub n_dead_tup: i64,
    pub last_vacuum: Option<String>,
    pub last_autovacuum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    pub schemaname: String,
    pub tablename: String,
    pub indexname: String,
    pub idx_scan: i64,
    pub idx_tup_read: i64,
    pub idx_tup_fetch: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockInfo {
    pub locktype: String,
    pub database: Option<String>,
    pub relation: Option<String>,
    pub pid: i32,
    pub mode: String,
    pub granted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BgWriterStats {
    pub checkpoints_timed: i64,
    pub checkpoints_req: i64,
    pub checkpoint_write_time: f64,
    pub checkpoint_sync_time: f64,
    pub buffers_checkpoint: i64,
    pub buffers_clean: i64,
    pub maxwritten_clean: i64,
    pub buffers_backend: i64,
    pub buffers_alloc: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseSize {
    pub database_name: String,
    pub size_bytes: i64,
    pub size_pretty: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplainNode {
    pub node_type: String,
    pub relation_name: Option<String>,
    pub alias: Option<String>,
    pub startup_cost: f64,
    pub total_cost: f64,
    pub plan_rows: i64,
    pub plan_width: i64,
    pub actual_startup_time: Option<f64>,
    pub actual_total_time: Option<f64>,
    pub actual_rows: Option<i64>,
    pub actual_loops: Option<i64>,
    pub filter: Option<String>,
    pub index_name: Option<String>,
    pub index_cond: Option<String>,
    pub join_type: Option<String>,
    pub hash_cond: Option<String>,
    pub sort_key: Option<Vec<String>>,
    pub shared_hit_blocks: Option<i64>,
    pub shared_read_blocks: Option<i64>,
    pub workers_planned: Option<i64>,
    pub workers_launched: Option<i64>,
    pub children: Vec<ExplainNode>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplainPlan {
    pub query: String,
    pub planning_time: Option<f64>,
    pub execution_time: Option<f64>,
    pub root: ExplainNode,
    pub total_cost: f64,
    pub warnings: Vec<String>,
}
