import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { LoaderCircle, TriangleAlert, X } from 'lucide-react';

export function groupError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;

    if (!error.response) return 'No se pudo conectar con el servidor.';
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;

    return 'No se pudo completar la operación.';
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

interface GroupDialogProps {
  title: string;
  busy?: boolean;
  children: ReactNode;
  onClose: () => void;
}

export default function GroupDialog({
  title, busy = false, children, onClose,
}: GroupDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    dialog?.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-3xl border border-purple-100 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-purple-100 bg-white px-5 py-4 sm:px-6">
        <h2 id={titleId} className="text-xl font-black text-purple-950">
          {title}
        </h2>

        <button
          type="button"
          disabled={busy}
          aria-label="Cerrar ventana"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
        >
          <X size={20} />
        </button>
      </header>

      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  );
}

interface GroupConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function GroupConfirmModal({
  title, message, confirmLabel, danger = false, onClose, onConfirm,
}: GroupConfirmModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const confirm = async () => {
    if (lock.current) return;

    lock.current = true;
    setBusy(true);
    setError('');
    let success = false;

    try {
      await onConfirm();
      success = true;
    } catch (cause) {
      setError(groupError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }

    if (success) onClose();
  };

  return (
    <GroupDialog title={title} busy={busy} onClose={onClose}>
      <div className={`mb-4 inline-flex rounded-2xl p-4 ${danger ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'}`}>
        <TriangleAlert size={28} aria-hidden="true" />
      </div>

      <p className="break-words text-sm leading-7 text-slate-600">{message}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          autoFocus
          type="button"
          disabled={busy}
          onClick={onClose}
          className="min-h-11 rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-40 ${
            danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-700 hover:bg-purple-800'
          }`}
        >
          {busy && <LoaderCircle size={17} className="motion-safe:animate-spin" />}
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </footer>
    </GroupDialog>
  );
}