import { useState } from 'react';
import { X, Loader2, Server, CheckCircle, XCircle, Database, Lock, Globe } from 'lucide-react';
import type { ConnectionConfig } from '../types';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface AddServerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddServerModal({ onClose, onSuccess }: AddServerModalProps) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '',
    use_ssl: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const config: ConnectionConfig = {
        id: crypto.randomUUID(),
        ...formData,
      };

      await api.addServer(config);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Failed to add server: ${error}`);
    } finally {
      setAdding(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const config: ConnectionConfig = {
        id: crypto.randomUUID(),
        ...formData,
      };

      const result = await api.testConnection(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--primary-muted)] rounded-lg">
              <Server className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Add Server
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Connect to PostgreSQL instance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Server Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Display Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Production DB"
            />
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Host
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="input input-with-icon"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Port
              </label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="input text-center"
              />
            </div>
          </div>

          {/* Database */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Database
            </label>
            <div className="relative">
              <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                required
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                className="input input-with-icon"
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pr-10"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>

          {/* SSL Toggle */}
          <label className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-xl cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.use_ssl}
              onChange={(e) => setFormData({ ...formData, use_ssl: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--primary)]
                focus:ring-[var(--primary)] focus:ring-offset-0 bg-[var(--bg-surface)]"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Use SSL Connection
              </span>
              <p className="text-xs text-[var(--text-tertiary)]">
                Encrypt connection to database
              </p>
            </div>
          </label>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl ${
                testResult.success
                  ? 'bg-[var(--success-muted)] border border-[var(--success)]/20'
                  : 'bg-[var(--error-muted)] border border-[var(--error)]/20'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                testResult.success ? 'text-[var(--success)]' : 'text-[var(--error)]'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || adding}
              className="btn btn-secondary flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
            <button
              type="submit"
              disabled={testing || adding}
              className="btn btn-primary flex-1"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Server'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
