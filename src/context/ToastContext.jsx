import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

// Toast types with their visual configuration
const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-500',
    icon: '✓',
    border: 'border-emerald-400',
  },
  error: {
    bg: 'bg-red-500',
    icon: '✕',
    border: 'border-red-400',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: '⚠',
    border: 'border-amber-400',
  },
  info: {
    bg: 'bg-baltic',
    icon: 'ℹ',
    border: 'border-baltic-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  // ---- Remove a toast by id ----
  const removeToast = useCallback((id) => {
    // Clear any existing timer
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // ---- Add a new toast ----
  // Options: { type, message, duration (ms) }
  const addToast = useCallback(
    (options = {}) => {
      const {
        type = 'info',
        message = '',
        duration = 3500,
      } = options;

      const id = ++toastIdCounter;

      const toast = {
        id,
        type,
        message,
        style: TOAST_STYLES[type] || TOAST_STYLES.info,
      };

      setToasts((prev) => {
        // Limit to 4 toasts max — remove oldest if exceeding
        const updated = [...prev, toast];
        if (updated.length > 4) {
          const removed = updated.shift();
          if (timersRef.current[removed.id]) {
            clearTimeout(timersRef.current[removed.id]);
            delete timersRef.current[removed.id];
          }
        }
        return updated;
      });

      // Auto-dismiss after duration (0 = manual dismiss only)
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id; // Return id so caller can manually dismiss if needed
    },
    [removeToast]
  );

  // ---- Convenience methods ----
  const success = useCallback(
    (message, duration) => addToast({ type: 'success', message, duration }),
    [addToast]
  );

  const error = useCallback(
    (message, duration) => addToast({ type: 'error', message, duration }),
    [addToast]
  );

  const warning = useCallback(
    (message, duration) => addToast({ type: 'warning', message, duration }),
    [addToast]
  );

  const info = useCallback(
    (message, duration) => addToast({ type: 'info', message, duration }),
    [addToast]
  );

  // ---- Clear all toasts ----
  const clearAll = useCallback(() => {
    // Clear all timers
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return ctx;
}

export default ToastContext;
