import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ToastContext } from '../../hooks/useToast';

// Provides toast() to the page and shows each message for a few seconds.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const toast = useCallback((text: string) => {
    const id = nextId.current++;
    setItems((list) => [...list, { id, text }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setItems((list) => list.filter((t) => t.id !== id));
    }, 3200);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => { for (const t of pending) clearTimeout(t); pending.clear(); };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast" aria-live="polite">
        {items.map((t) => <div key={t.id} className="toast-item">{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
