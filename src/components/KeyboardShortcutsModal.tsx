import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { getShortcutsList } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const shortcutsList = getShortcutsList();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-default)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          {shortcutsList.map(({ category, shortcuts }) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(({ key, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-base)]"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">
                      {description}
                    </span>
                    <kbd className="inline-flex items-center gap-1">
                      {key.split(' ').map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[var(--text-muted)] text-xs">then</span>}
                          <span className="px-2 py-1 text-xs font-mono font-medium rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                            {k.toUpperCase()}
                          </span>
                        </span>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] rounded-b-xl">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}
