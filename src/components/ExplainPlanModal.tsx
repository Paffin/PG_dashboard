import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Database,
  ChevronRight,
  ChevronDown,
  Zap,
  HardDrive,
  ArrowRight,
  Layers,
  Search,
  Filter,
  GitBranch,
} from 'lucide-react';
import type { ExplainPlan, ExplainNode } from '../types';
import { Badge } from './ui';

interface ExplainPlanModalProps {
  plan: ExplainPlan;
  onClose: () => void;
}

const NODE_ICONS: Record<string, React.ElementType> = {
  'Seq Scan': Database,
  'Index Scan': Search,
  'Index Only Scan': Search,
  'Bitmap Index Scan': Search,
  'Bitmap Heap Scan': Database,
  'Nested Loop': GitBranch,
  'Hash Join': GitBranch,
  'Merge Join': GitBranch,
  'Sort': Layers,
  'Aggregate': Layers,
  'Hash': HardDrive,
  'Materialize': HardDrive,
  'Filter': Filter,
  'Limit': Layers,
  'Gather': Zap,
  'Gather Merge': Zap,
};

const NODE_COLORS: Record<string, string> = {
  'Seq Scan': 'var(--warning)',
  'Index Scan': 'var(--success)',
  'Index Only Scan': 'var(--success)',
  'Bitmap Index Scan': 'var(--info)',
  'Bitmap Heap Scan': 'var(--info)',
  'Nested Loop': 'var(--primary)',
  'Hash Join': 'var(--primary)',
  'Merge Join': 'var(--primary)',
  'Sort': 'var(--text-secondary)',
  'Aggregate': 'var(--text-secondary)',
};

function getNodeColor(nodeType: string): string {
  return NODE_COLORS[nodeType] || 'var(--text-tertiary)';
}

function formatTime(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatCost(cost: number): string {
  if (cost < 1000) return cost.toFixed(2);
  if (cost < 1000000) return `${(cost / 1000).toFixed(1)}K`;
  return `${(cost / 1000000).toFixed(1)}M`;
}

function formatRows(rows: number | null): string {
  if (rows === null) return '-';
  if (rows < 1000) return rows.toString();
  if (rows < 1000000) return `${(rows / 1000).toFixed(1)}K`;
  return `${(rows / 1000000).toFixed(1)}M`;
}

interface NodeRowProps {
  node: ExplainNode;
  depth: number;
  maxCost: number;
  maxTime: number | null;
  isAnalyze: boolean;
}

function NodeRow({ node, depth, maxCost, maxTime, isAnalyze }: NodeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const Icon = NODE_ICONS[node.node_type] || ArrowRight;

  const costPercentage = maxCost > 0 ? (node.total_cost / maxCost) * 100 : 0;
  const timePercentage = maxTime && node.actual_total_time
    ? ((node.actual_total_time * (node.actual_loops || 1)) / maxTime) * 100
    : 0;

  const hasWarnings = node.warnings.length > 0;
  const isSeqScan = node.node_type === 'Seq Scan';
  const rowMismatch = node.actual_rows !== null && node.plan_rows > 0 &&
    (node.actual_rows / node.plan_rows > 10 || node.actual_rows / node.plan_rows < 0.1);

  return (
    <>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-[var(--bg-hover)] transition-colors ${hasWarnings ? 'bg-[var(--warning)]/5' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-0.5 rounded hover:bg-[var(--bg-subtle)] ${hasChildren ? '' : 'invisible'}`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </button>

        {/* Node type with icon */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Icon className="w-4 h-4" style={{ color: getNodeColor(node.node_type) }} />
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {node.node_type}
          </span>
          {node.join_type && (
            <Badge variant="default" size="sm">{node.join_type}</Badge>
          )}
          {hasWarnings && (
            <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
          )}
        </div>

        {/* Relation/Table */}
        <div className="w-[150px] text-sm text-[var(--text-secondary)] truncate" title={node.relation_name || node.index_name || ''}>
          {node.relation_name || node.index_name || '-'}
        </div>

        {/* Cost bar */}
        <div className="w-[120px] flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(costPercentage, 100)}%`,
                backgroundColor: isSeqScan ? 'var(--warning)' : 'var(--primary)',
              }}
            />
          </div>
          <span className="text-xs text-[var(--text-tertiary)] tabular-nums w-[50px] text-right">
            {formatCost(node.total_cost)}
          </span>
        </div>

        {/* Rows */}
        <div className={`w-[80px] text-right text-sm tabular-nums ${rowMismatch ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {formatRows(isAnalyze ? node.actual_rows : node.plan_rows)}
          {isAnalyze && node.actual_loops && node.actual_loops > 1 && (
            <span className="text-xs text-[var(--text-muted)]"> ×{node.actual_loops}</span>
          )}
        </div>

        {/* Time (only for ANALYZE) */}
        {isAnalyze && (
          <div className="w-[120px] flex items-center gap-2">
            <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--info)] rounded-full transition-all"
                style={{ width: `${Math.min(timePercentage, 100)}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums w-[60px] text-right">
              {formatTime(node.actual_total_time)}
            </span>
          </div>
        )}

        {/* Buffers */}
        {isAnalyze && (
          <div className="w-[80px] text-right text-xs text-[var(--text-tertiary)] tabular-nums">
            {node.shared_hit_blocks !== null && (
              <span title="Shared Hit Blocks" className="text-[var(--success)]">
                {formatRows(node.shared_hit_blocks)}
              </span>
            )}
            {node.shared_read_blocks !== null && node.shared_read_blocks > 0 && (
              <span title="Shared Read Blocks" className="text-[var(--warning)] ml-1">
                +{formatRows(node.shared_read_blocks)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Condition details */}
      {expanded && (node.filter || node.index_cond || node.hash_cond) && (
        <div
          className="text-xs text-[var(--text-tertiary)] py-1 px-3 bg-[var(--bg-subtle)]/50 font-mono"
          style={{ paddingLeft: `${depth * 24 + 48}px` }}
        >
          {node.filter && <div>Filter: {node.filter}</div>}
          {node.index_cond && <div>Index Cond: {node.index_cond}</div>}
          {node.hash_cond && <div>Hash Cond: {node.hash_cond}</div>}
          {node.sort_key && <div>Sort Key: {node.sort_key.join(', ')}</div>}
        </div>
      )}

      {/* Warnings */}
      {expanded && hasWarnings && (
        <div
          className="py-1 px-3"
          style={{ paddingLeft: `${depth * 24 + 48}px` }}
        >
          {node.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--warning)]">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && node.children.map((child, index) => (
        <NodeRow
          key={index}
          node={child}
          depth={depth + 1}
          maxCost={maxCost}
          maxTime={maxTime}
          isAnalyze={isAnalyze}
        />
      ))}
    </>
  );
}

export default function ExplainPlanModal({ plan, onClose }: ExplainPlanModalProps) {
  const isAnalyze = plan.execution_time !== null;
  const maxTime = isAnalyze
    ? (plan.root.actual_total_time || 0) * (plan.root.actual_loops || 1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-[var(--border-default)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary)]/10">
              <Zap className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Query Execution Plan
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {isAnalyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN'} visualization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Total Cost</p>
              <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                {formatCost(plan.total_cost)}
              </p>
            </div>
            {plan.planning_time !== null && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Planning Time</p>
                <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatTime(plan.planning_time)}
                </p>
              </div>
            )}
            {plan.execution_time !== null && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Execution Time</p>
                <p className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatTime(plan.execution_time)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Warnings</p>
              <p className={`text-xl font-semibold tabular-nums ${plan.warnings.length > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                {plan.warnings.length}
              </p>
            </div>
          </div>
        </div>

        {/* Warnings section */}
        {plan.warnings.length > 0 && (
          <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--warning)]/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
              <span className="text-sm font-medium text-[var(--warning)]">Performance Warnings</span>
            </div>
            <ul className="space-y-1">
              {plan.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--warning)]">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Query */}
        <div className="px-6 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-tertiary)]">Query</span>
          </div>
          <code className="block text-sm text-[var(--text-secondary)] font-mono bg-[var(--bg-subtle)] p-3 rounded-lg overflow-x-auto max-h-24">
            {plan.query}
          </code>
        </div>

        {/* Plan tree */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center gap-2 py-2 px-3 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] font-medium">
            <div style={{ width: 24 }} />
            <div className="min-w-[200px]">Operation</div>
            <div className="w-[150px]">Object</div>
            <div className="w-[120px]">Cost</div>
            <div className="w-[80px] text-right">Rows</div>
            {isAnalyze && (
              <>
                <div className="w-[120px]">Time</div>
                <div className="w-[80px] text-right">Buffers</div>
              </>
            )}
          </div>

          {/* Tree */}
          <div className="divide-y divide-[var(--border-subtle)]">
            <NodeRow
              node={plan.root}
              depth={0}
              maxCost={plan.total_cost}
              maxTime={maxTime}
              isAnalyze={isAnalyze}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
              <span>Index Scan</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
              <span>Seq Scan</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
              <span>Join</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
