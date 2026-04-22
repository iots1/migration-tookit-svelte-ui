type DialogType = 'danger' | 'success' | 'duplicate' | 'warning';

interface DialogOptions {
  title?: string;
  description?: string;
  type?: DialogType;
  cancelText?: string;
  confirmText?: string;
}

interface DialogState {
  open: boolean;
  title: string;
  description: string;
  type: DialogType;
  cancelText: string;
  confirmText: string;
}

const DEFAULTS: Record<DialogType, Omit<DialogState, 'open' | 'type'>> = {
  danger: {
    title: 'Delete',
    description:
      'Are you sure you want to delete this? This action cannot be undone.',
    cancelText: 'Cancel',
    confirmText: 'Delete',
  },
  success: {
    title: 'Confirm',
    description: 'Are you sure you want to proceed?',
    cancelText: 'Cancel',
    confirmText: 'Confirm',
  },
  duplicate: {
    title: 'Duplicate',
    description: 'Create a copy of this item?',
    cancelText: 'Cancel',
    confirmText: 'Duplicate',
  },
  warning: {
    title: 'Warning',
    description: 'Are you sure you want to proceed?',
    cancelText: 'Cancel',
    confirmText: 'Proceed',
  },
};

export const dialog = $state<DialogState>({
  open: false,
  title: '',
  description: '',
  type: 'danger',
  cancelText: 'Cancel',
  confirmText: 'Delete',
});

let resolvePromise: ((value: boolean) => void) | null = null;

export function confirmDialog(options: DialogOptions = {}): Promise<boolean> {
  const type = options.type ?? 'danger';
  const defaults = DEFAULTS[type];

  dialog.open = true;
  dialog.type = type;
  dialog.title = options.title ?? defaults.title;
  dialog.description = options.description ?? defaults.description;
  dialog.cancelText = options.cancelText ?? defaults.cancelText;
  dialog.confirmText = options.confirmText ?? defaults.confirmText;

  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

export function resolveDialog(confirmed: boolean): void {
  dialog.open = false;
  resolvePromise?.(confirmed);
  resolvePromise = null;
}
