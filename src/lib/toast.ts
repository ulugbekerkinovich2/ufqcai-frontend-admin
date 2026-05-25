type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let _toasts: ToastItem[] = [];
let _listener: Listener | null = null;

function notify() {
  _listener?.([..._toasts]);
}

function add(message: string, type: ToastType, duration = 3500) {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, duration);
}

export const toast = {
  success: (message: string) => add(message, "success"),
  error: (message: string) => add(message, "error", 5000),
  info: (message: string) => add(message, "info"),
  _subscribe: (fn: Listener) => {
    _listener = fn;
    return () => { _listener = null; };
  },
};
