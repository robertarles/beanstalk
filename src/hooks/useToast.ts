import { useState, useCallback } from 'react';

interface ToastEntry {
  id: number;
  message: string;
  type: 'error' | 'success';
}

let nextId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
