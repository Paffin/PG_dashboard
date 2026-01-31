use crate::db::types::{ConnectionConfig, ConnectionTestResult, ServerInfo};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio_postgres::NoTls;

pub struct ConnectionManager {
    pools: Arc<Mutex<HashMap<String, Pool>>>,
    configs: Arc<Mutex<HashMap<String, ConnectionConfig>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        ConnectionManager {
            pools: Arc::new(Mutex::new(HashMap::new())),
            configs: Arc::new(Mutex::new(HashMap::new())),
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

        let pool = pg_config
            .create_pool(Some(Runtime::Tokio1), NoTls)
            .map_err(|e| format!("Failed to create pool: {}", e))?;

        // Test the connection
        let _client = pool.get()
            .await
            .map_err(|e| format!("Failed to get connection from pool: {}", e))?;

        let mut pools = self.pools.lock().unwrap();
        let mut configs = self.configs.lock().unwrap();

        pools.insert(config.id.clone(), pool);
        configs.insert(config.id.clone(), config);

        Ok(())
    }

    pub async fn remove_connection(&self, id: &str) -> Result<(), String> {
        let mut pools = self.pools.lock().unwrap();
        let mut configs = self.configs.lock().unwrap();

        pools.remove(id);
        configs.remove(id);

        Ok(())
    }

    pub fn get_server_info(&self, id: &str) -> Option<ServerInfo> {
        let configs = self.configs.lock().unwrap();
        let pools = self.pools.lock().unwrap();

        configs.get(id).map(|config| {
            let connected = pools.contains_key(id);
            ServerInfo {
                id: config.id.clone(),
                name: config.name.clone(),
                host: config.host.clone(),
                port: config.port,
                database: config.database.clone(),
                username: config.username.clone(),
                connected,
                postgres_version: None, // Will be fetched separately
            }
        })
    }

    pub fn list_servers(&self) -> Vec<ServerInfo> {
        let configs = self.configs.lock().unwrap();
        let pools = self.pools.lock().unwrap();

        configs
            .values()
            .map(|config| {
                let connected = pools.contains_key(&config.id);
                ServerInfo {
                    id: config.id.clone(),
                    name: config.name.clone(),
                    host: config.host.clone(),
                    port: config.port,
                    database: config.database.clone(),
                    username: config.username.clone(),
                    connected,
                    postgres_version: None,
                }
            })
            .collect()
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
