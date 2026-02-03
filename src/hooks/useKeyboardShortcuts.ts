import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: string;
}

interface UseKeyboardShortcutsOptions {
  onRefresh?: () => void;
  onToggleAutoRefresh?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onRefresh, onToggleAutoRefresh, onShowHelp } = options;
  const navigate = useNavigate();
  const pendingKey = useRef<string | null>(null);
  const pendingTimeout = useRef<number | null>(null);

  const shortcuts: Shortcut[] = [
    // Navigation (g + key)
    { key: 'g s', description: 'Go to Servers', action: () => navigate('/'), category: 'Navigation' },
    { key: 'g d', description: 'Go to Dashboard', action: () => navigate('/dashboard'), category: 'Navigation' },
    { key: 'g m', description: 'Go to Metrics', action: () => navigate('/metrics'), category: 'Navigation' },
    { key: 'g c', description: 'Go to Configuration', action: () => navigate('/configuration'), category: 'Navigation' },
    { key: 'g i', description: 'Go to Issues', action: () => navigate('/issues'), category: 'Navigation' },
    // Actions
    ...(onRefresh ? [{ key: 'r', description: 'Refresh data', action: onRefresh, category: 'Actions' }] : []),
    ...(onToggleAutoRefresh ? [{ key: 'a', description: 'Toggle auto-refresh', action: onToggleAutoRefresh, category: 'Actions' }] : []),
    ...(onShowHelp ? [{ key: '?', description: 'Show keyboard shortcuts', action: onShowHelp, category: 'Help' }] : []),
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();

    // Handle chord shortcuts (g + key)
    if (pendingKey.current === 'g') {
      const fullKey = `g ${key}`;
      const shortcut = shortcuts.find(s => s.key === fullKey);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
      pendingKey.current = null;
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }
      return;
    }

    // Start chord sequence
    if (key === 'g') {
      pendingKey.current = 'g';
      // Reset after 1 second
      pendingTimeout.current = window.setTimeout(() => {
        pendingKey.current = null;
      }, 1000);
      return;
    }

    // Handle single-key shortcuts
    const shortcut = shortcuts.find(s => s.key === key || (key === '/' && e.shiftKey && s.key === '?'));
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }, [shortcuts, navigate, onRefresh, onToggleAutoRefresh, onShowHelp]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, [handleKeyDown]);

  return { shortcuts };
}

/**
 * Get all available shortcuts for display in help modal
 */
export function getShortcutsList(): { category: string; shortcuts: { key: string; description: string }[] }[] {
  return [
    {
      category: 'Navigation',
      shortcuts: [
        { key: 'g s', description: 'Go to Servers' },
        { key: 'g d', description: 'Go to Dashboard' },
        { key: 'g m', description: 'Go to Metrics' },
        { key: 'g c', description: 'Go to Configuration' },
        { key: 'g i', description: 'Go to Issues' },
      ],
    },
    {
      category: 'Actions',
      shortcuts: [
        { key: 'r', description: 'Refresh data' },
        { key: 'a', description: 'Toggle auto-refresh' },
      ],
    },
    {
      category: 'Help',
      shortcuts: [
        { key: '?', description: 'Show keyboard shortcuts' },
        { key: 'Esc', description: 'Close modals' },
      ],
    },
  ];
}
