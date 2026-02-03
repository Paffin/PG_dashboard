export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  use_ssl: boolean;
}

export interface ServerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  connected: boolean;
  postgres_version: string | null;
}

export interface ServerGroup {
  id: string;
  name: string;
  color: string;
  serverIds: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  postgres_version: string | null;
}

// Metrics Types
export interface DatabaseStats {
  datname: string;
  numbackends: number;
  xact_commit: number;
  xact_rollback: number;
  blks_read: number;
  blks_hit: number;
  tup_returned: number;
  tup_fetched: number;
  tup_inserted: number;
  tup_updated: number;
  tup_deleted: number;
  conflicts: number;
  temp_files: number;
  temp_bytes: number;
  deadlocks: number;
}

export interface QueryStat {
  query: string;
  calls: number;
  total_exec_time: number;
  mean_exec_time: number;
  min_exec_time: number;
  max_exec_time: number;
  rows: number;
  shared_blks_hit: number;
  shared_blks_read: number;
}

export interface ActiveQuery {
  pid: number;
  usename: string;
  application_name: string;
  client_addr: string | null;
  backend_start: string;
  state: string;
  query: string;
  wait_event_type: string | null;
  wait_event: string | null;
}

export interface TableStats {
  schemaname: string;
  relname: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number | null;
  idx_tup_fetch: number | null;
  n_tup_ins: number;
  n_tup_upd: number;
  n_tup_del: number;
  n_live_tup: number;
  n_dead_tup: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
}

export interface IndexStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export interface LockInfo {
  locktype: string;
  database: string | null;
  relation: string | null;
  pid: number;
  mode: string;
  granted: boolean;
}

export interface BgWriterStats {
  checkpoints_timed: number;
  checkpoints_req: number;
  checkpoint_write_time: number;
  checkpoint_sync_time: number;
  buffers_checkpoint: number;
  buffers_clean: number;
  maxwritten_clean: number;
  buffers_backend: number;
  buffers_alloc: number;
}

export interface DatabaseSize {
  database_name: string;
  size_bytes: number;
  size_pretty: string;
}

// Configuration Types
export interface PostgresConfig {
  name: string;
  setting: string;
  unit: string | null;
  category: string;
  short_desc: string | null;
  source: string;
  min_val: string | null;
  max_val: string | null;
}

export interface HardwareInfo {
  cpu_cores: number;
  total_memory_mb: number;
  postgres_version: string;
  os_type: string;
}

// Analysis Types
export interface ConfigIssue {
  parameter: string;
  current_value: string;
  recommended_value: string;
  severity: 'Critical' | 'Warning' | 'Info';
  reason: string;
}

export interface PerformanceIssue {
  issue_type: string;
  severity: 'Critical' | 'Warning' | 'Info';
  description: string;
  recommendation: string;
  details: string | null;
}

// EXPLAIN Plan Types
export interface ExplainNode {
  node_type: string;
  relation_name: string | null;
  alias: string | null;
  startup_cost: number;
  total_cost: number;
  plan_rows: number;
  plan_width: number;
  actual_startup_time: number | null;
  actual_total_time: number | null;
  actual_rows: number | null;
  actual_loops: number | null;
  filter: string | null;
  index_name: string | null;
  index_cond: string | null;
  join_type: string | null;
  hash_cond: string | null;
  sort_key: string[] | null;
  shared_hit_blocks: number | null;
  shared_read_blocks: number | null;
  workers_planned: number | null;
  workers_launched: number | null;
  children: ExplainNode[];
  warnings: string[];
}

export interface ExplainPlan {
  query: string;
  planning_time: number | null;
  execution_time: number | null;
  root: ExplainNode;
  total_cost: number;
  warnings: string[];
}
