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

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  postgres_version: string | null;
}
