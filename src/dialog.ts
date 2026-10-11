import { shallowRef } from 'nativescript-vue';

export interface DialogOptions {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface OpenDialog extends DialogOptions {
  resolve: (confirmed: boolean) => void;
}

/** The dialog the app shell is showing, if any. */
export const currentDialog = shallowRef<OpenDialog | null>(null);

/**
 * Shows a Bootstrap `.dialog` over the app, with a backdrop, and resolves `true` when it's
 * confirmed and `false` when it's cancelled or the backdrop is tapped. The app shell draws it:
 * there's no `<dialog>` element or top layer in a native app.
 */
export function showDialog(options: DialogOptions): Promise<boolean> {
  currentDialog.value?.resolve(false);
  return new Promise((resolve) => {
    currentDialog.value = { ...options, resolve };
  });
}

export function closeDialog(confirmed: boolean) {
  const dialog = currentDialog.value;
  currentDialog.value = null;
  dialog?.resolve(confirmed);
}
