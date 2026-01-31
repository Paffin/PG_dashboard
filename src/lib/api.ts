import { invoke } from '@tauri-apps/api/core';
import type { ConnectionConfig, ServerInfo, ConnectionTestResult } from '../types';

export const api = {
  // Connection Management
  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    return await invoke('test_connection', { config });
  },

  async addServer(config: ConnectionConfig): Promise<void> {
    return await invoke('add_server', { config });
  },

  async removeServer(id: string): Promise<void> {
    return await invoke('remove_server', { id });
  },

  async getServerInfo(id: string): Promise<ServerInfo | null> {
    return await invoke('get_server_info', { id });
  },

  async listServers(): Promise<ServerInfo[]> {
    return await invoke('list_servers');
  },

  // Metrics
  async getDatabaseStats(serverId: string): Promise<any[]> {
    return await invoke('get_database_stats', { serverId });
  },

  async getTopQueries(serverId: string, limit: number = 10): Promise<any[]> {
    return await invoke('get_top_queries', { serverId, limit });
  },

  async getActiveQueries(serverId: string): Promise<any[]> {
    return await invoke('get_active_queries', { serverId });
  },

  async getTableStats(serverId: string, limit: number = 10): Promise<any[]> {
    return await invoke('get_table_stats', { serverId, limit });
  },

  async getIndexStats(serverId: string, limit: number = 10): Promise<any[]> {
    return await invoke('get_index_stats', { serverId, limit });
  },

  async getLocks(serverId: string): Promise<any[]> {
    return await invoke('get_locks', { serverId });
  },

  async getBgwriterStats(serverId: string): Promise<any> {
    return await invoke('get_bgwriter_stats', { serverId });
  },

  async getDatabaseSizes(serverId: string): Promise<any[]> {
    return await invoke('get_database_sizes', { serverId });
  },

  // Configuration
  async getAllSettings(serverId: string): Promise<any[]> {
    return await invoke('get_all_settings', { serverId });
  },

  async getHardwareInfo(serverId: string): Promise<any> {
    return await invoke('get_hardware_info', { serverId });
  },

  // Analysis
  async analyzeConfiguration(serverId: string): Promise<any[]> {
    return await invoke('analyze_configuration', { serverId });
  },

  async detectPerformanceIssues(serverId: string): Promise<any[]> {
    return await invoke('detect_performance_issues', { serverId });
  },
};
