/**
 * Export and copy utilities for data tables and query results
 */

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return '';

  // Use provided columns or infer from first row
  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    header: key,
  }));

  // Header row
  const header = cols.map(col => escapeCSV(col.header)).join(',');

  // Data rows
  const rows = data.map(row =>
    cols.map(col => escapeCSV(String(row[col.key] ?? ''))).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  // If value contains comma, newline, or double quote, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert array of objects to JSON string
 */
export function toJSON<T>(data: T[], pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Download data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  const csv = toCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export data as JSON file
 */
export function exportJSON<T>(data: T[], filename: string): void {
  const json = toJSON(data);
  downloadFile(json, `${filename}.json`, 'application/json');
}

/**
 * Format date for filename
 */
export function formatDateForFilename(): string {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
}
