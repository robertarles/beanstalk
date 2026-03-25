import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const baseClass =
    'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-sm';
  const colorClass =
    type === 'error'
      ? 'bg-red-600'
      : 'bg-green-600';

  return (
    <div className={`${baseClass} ${colorClass}`} role="alert" aria-live="assertive">
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
