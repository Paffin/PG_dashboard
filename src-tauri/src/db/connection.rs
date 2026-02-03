use crate::db::types::{ConnectionConfig, ConnectionTestResult, ServerInfo};
use crate::db::storage::{self, SavedServerConfig};
use deadpool_postgres::{Config, ManagerConfig, Pool, PoolConfig, RecyclingMethod, Runtime, Timeouts};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio_postgres::NoTls;

pub struct ConnectionManager {
    pools: Arc<Mutex<HashMap<String, Pool>>>,
    configs: Arc<Mutex<HashMap<String, ConnectionConfig>>>,
    /// Saved server configs (persisted to disk)
    saved_servers: Arc<Mutex<HashMap<String, SavedServerConfig>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        // Load saved servers from disk
        let saved = storage::load_servers();
        let mut saved_map = HashMap::new();
        for server in saved {
            saved_map.insert(server.id.clone(), server);
        }

        ConnectionManager {
            pools: Arc::new(Mutex::new(HashMap::new())),
            configs: Arc::new(Mutex::new(HashMap::new())),
            saved_servers: Arc::new(Mutex::new(saved_map)),
        }
    }

    pub async fn test_connection(&self, config: &ConnectionConfig) -> ConnectionTestResult {
        let conn_string = format!(
            "host={} port={} dbname={} user={} password={}",
            config.host, config.port, config.database, config.username, config.password
        );

        match tokio_postgres::connect(&conn_string, NoTls).await {
            Ok((client, connection)) => {
                // Spawn connection handler
                tokio::spawn(async move {
                    if let Err(e) = connection.await {
                        eprintln!("connection error: {}", e);
                    }
                });

                // Get PostgreSQL version
                let version_result = client
                    .query_one("SELECT version()", &[])
                    .await;

                let postgres_version = match version_result {
                    Ok(row) => {
                        let version: String = row.get(0);
                        Some(version)
                    }
                    Err(_) => None,
                };

                ConnectionTestResult {
                    success: true,
                    message: "Connection successful".to_string(),
                    postgres_version,
                }
            }
            Err(e) => ConnectionTestResult {
                success: false,
                message: format!("Connection failed: {}", e),
                postgres_version: None,
            },
        }
    }

    pub async fn add_connection(&self, config: ConnectionConfig) -> Result<(), String> {
        let mut pg_config = Config::new();
        pg_config.host = Some(config.host.clone());
        pg_config.port = Some(config.port);
        pg_config.dbname = Some(config.database.clone());
        pg_config.user = Some(config.username.clone());
        pg_config.password = Some(config.password.clone());
        pg_config.manager = Some(ManagerConfig {
            recycling_method: RecyclingMethod::Fast,
        });
        pg_config.pool = Some(PoolConfig {
            max_size: 16,
            timeouts: Timeouts {
                wait: Some(Duration::from_secs(30)),
                create: Some(Duration::from_secs(30)),
                recycle: Some(Duration::from_secs(10)),
            },
            ..Default::default()
        });

        let pool = pg_config
            .create_pool(Some(Runtime::Tokio1), NoTls)
            .map_err(|e| format!("Failed to create pool: {}", e))?;

        // Test the connection
        let _client = pool.get()
            .await
            .map_err(|e| format!("Failed to get connection from pool: {}", e))?;

        // Save to persistent storage
        let saved_config = SavedServerConfig {
            id: config.id.clone(),
            name: config.name.clone(),
            host: config.host.clone(),
            port: config.port,
            database: config.database.clone(),
            username: config.username.clone(),
            use_ssl: config.use_ssl,
            password: config.password.clone(), // Store password for reconnect
        };
        storage::add_server(&saved_config)?;

        let mut pools = self.pools.lock().unwrap();
        let mut configs = self.configs.lock().unwrap();
        let mut saved = self.saved_servers.lock().unwrap();

        pools.insert(config.id.clone(), pool);
        configs.insert(config.id.clone(), config);
        saved.insert(saved_config.id.clone(), saved_config);

        Ok(())
    }

    pub async fn remove_connection(&self, id: &str) -> Result<(), String> {
        // Remove from persistent storage
        storage::remove_server(id)?;

        let mut pools = self.pools.lock().unwrap();
        let mut configs = self.configs.lock().unwrap();
        let mut saved = self.saved_servers.lock().unwrap();

        pools.remove(id);
        configs.remove(id);
        saved.remove(id);

        Ok(())
    }

    pub fn get_server_info(&self, id: &str) -> Option<ServerInfo> {
        let configs = self.configs.lock().unwrap();
        let pools = self.pools.lock().unwrap();
        let saved = self.saved_servers.lock().unwrap();

        // First check active configs, then saved
        if let Some(config) = configs.get(id) {
            let connected = pools.contains_key(id);
            return Some(ServerInfo {
                id: config.id.clone(),
                name: config.name.clone(),
                host: config.host.clone(),
                port: config.port,
                database: config.database.clone(),
                username: config.username.clone(),
                connected,
                postgres_version: None,
            });
        }

        // Check saved servers (not connected)
        saved.get(id).map(|server| ServerInfo {
            id: server.id.clone(),
            name: server.name.clone(),
            host: server.host.clone(),
            port: server.port,
            database: server.database.clone(),
            username: server.username.clone(),
            connected: false,
            postgres_version: None,
        })
    }

    pub fn list_servers(&self) -> Vec<ServerInfo> {
        let configs = self.configs.lock().unwrap();
        let pools = self.pools.lock().unwrap();
        let saved = self.saved_servers.lock().unwrap();

        // Combine active and saved servers
        let mut servers: HashMap<String, ServerInfo> = HashMap::new();

        // Add saved servers first (as disconnected)
        for server in saved.values() {
            servers.insert(server.id.clone(), ServerInfo {
                id: server.id.clone(),
                name: server.name.clone(),
                host: server.host.clone(),
                port: server.port,
                database: server.database.clone(),
                username: server.username.clone(),
                connected: false,
                postgres_version: None,
            });
        }

        // Override with active connections
        for config in configs.values() {
            let connected = pools.contains_key(&config.id);
            servers.insert(config.id.clone(), ServerInfo {
                id: config.id.clone(),
                name: config.name.clone(),
                host: config.host.clone(),
                port: config.port,
                database: config.database.clone(),
                username: config.username.clone(),
                connected,
                postgres_version: None,
            });
        }

        servers.into_values().collect()
    }

    /// Reconnect to a saved server using stored credentials
    pub async fn reconnect(&self, id: &str) -> Result<(), String> {
        let saved = {
            let saved = self.saved_servers.lock().unwrap();
            saved.get(id).cloned()
        };

        let Some(server) = saved else {
            return Err("Server not found".to_string());
        };

        if server.password.is_empty() {
            return Err("Password required for reconnection".to_string());
        }

        let config = ConnectionConfig {
            id: server.id,
            name: server.name,
            host: server.host,
            port: server.port,
            database: server.database,
            username: server.username,
            password: server.password,
            use_ssl: server.use_ssl,
        };

        // Create pool and connect
        let mut pg_config = Config::new();
        pg_config.host = Some(config.host.clone());
        pg_config.port = Some(config.port);
        pg_config.dbname = Some(config.database.clone());
        pg_config.user = Some(config.username.clone());
        pg_config.password = Some(config.password.clone());
        pg_config.manager = Some(ManagerConfig {
            recycling_method: RecyclingMethod::Fast,
        });
        pg_config.pool = Some(PoolConfig {
            max_size: 16,
            timeouts: Timeouts {
                wait: Some(Duration::from_secs(30)),
                create: Some(Duration::from_secs(30)),
                recycle: Some(Duration::from_secs(10)),
            },
            ..Default::default()
        });

        let pool = pg_config
            .create_pool(Some(Runtime::Tokio1), NoTls)
            .map_err(|e| format!("Failed to create pool: {}", e))?;

        // Test the connection
        let _client = pool.get()
            .await
            .map_err(|e| format!("Failed to connect: {}", e))?;

        let mut pools = self.pools.lock().unwrap();
        let mut configs = self.configs.lock().unwrap();

        pools.insert(config.id.clone(), pool);
        configs.insert(config.id.clone(), config);

        Ok(())
    }

    pub async fn get_client(&self, id: &str) -> Result<deadpool_postgres::Client, String> {
        let pool = {
            let pools = self.pools.lock().unwrap();
            pools.get(id).cloned().ok_or("Connection not found".to_string())?
        };

        pool.get().await
            .map_err(|e| format!("Failed to get client: {}", e))
    }
}
