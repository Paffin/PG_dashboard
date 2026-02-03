use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const KEYRING_SERVICE: &str = "pg-dashboard";

/// Server config saved to disk (password stored in OS keyring)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedServerConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub use_ssl: bool,
    #[serde(skip)]
    pub password: String, // Not serialized - stored in OS keyring
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoredData {
    pub servers: Vec<SavedServerConfig>,
}

fn get_config_path() -> Option<PathBuf> {
    dirs::data_local_dir().map(|p| p.join("pg-dashboard").join("servers.json"))
}

pub fn load_servers() -> Vec<SavedServerConfig> {
    let Some(path) = get_config_path() else {
        return Vec::new();
    };

    if !path.exists() {
        return Vec::new();
    }

    match fs::read_to_string(&path) {
        Ok(content) => {
            match serde_json::from_str::<StoredData>(&content) {
                Ok(data) => {
                    // Load passwords from keyring for each server
                    data.servers
                        .into_iter()
                        .map(|mut server| {
                            server.password = get_password_from_keyring(&server.id).unwrap_or_default();
                            server
                        })
                        .collect()
                }
                Err(e) => {
                    eprintln!("Failed to parse servers config: {}", e);
                    Vec::new()
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to read servers config: {}", e);
            Vec::new()
        }
    }
}

/// Get password from OS keyring
fn get_password_from_keyring(server_id: &str) -> Option<String> {
    Entry::new(KEYRING_SERVICE, server_id)
        .ok()
        .and_then(|entry| entry.get_password().ok())
}

/// Save password to OS keyring
fn set_password_in_keyring(server_id: &str, password: &str) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, server_id)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    entry
        .set_password(password)
        .map_err(|e| format!("Failed to save password to keyring: {}", e))
}

/// Delete password from OS keyring
fn delete_password_from_keyring(server_id: &str) -> Result<(), String> {
    if let Ok(entry) = Entry::new(KEYRING_SERVICE, server_id) {
        // Ignore error if password doesn't exist
        let _ = entry.delete_credential();
    }
    Ok(())
}

pub fn save_servers(servers: &[SavedServerConfig]) -> Result<(), String> {
    let Some(path) = get_config_path() else {
        return Err("Could not determine config directory".to_string());
    };

    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let data = StoredData {
        servers: servers.to_vec(),
    };

    let content = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

pub fn add_server(config: &SavedServerConfig) -> Result<(), String> {
    // Save password to keyring first
    if !config.password.is_empty() {
        set_password_in_keyring(&config.id, &config.password)?;
    }

    let mut servers = load_servers();

    // Remove existing with same ID
    servers.retain(|s| s.id != config.id);
    servers.push(config.clone());

    save_servers(&servers)
}

pub fn remove_server(id: &str) -> Result<(), String> {
    // Delete password from keyring
    delete_password_from_keyring(id)?;

    let mut servers = load_servers();
    servers.retain(|s| s.id != id);
    save_servers(&servers)
}

pub fn update_server_password(id: &str, password: &str) -> Result<(), String> {
    // Save password to keyring (servers list doesn't need update)
    set_password_in_keyring(id, password)
}
