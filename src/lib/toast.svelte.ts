interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toasts = $state<ToastItem[]>([]);
let _nextId = 0;

export function showToast(
  message: string,
  type: ToastItem['type'] = 'success',
  duration = 3000
) {
  const id = _nextId++;
  toasts = [...toasts, { id, message, type }];
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
  }, duration);
}

export function getToasts(): ToastItem[] {
  return toasts;
}
