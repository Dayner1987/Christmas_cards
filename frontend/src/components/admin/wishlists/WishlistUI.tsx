import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { AlertCircle, ImageIcon, X } from 'lucide-react';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join('. ');
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (!error.response) {
      return 'No se pudo conectar con el servidor.';
    }
  }

  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación.';
}

export function safeHttpUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value.trim());

    return ['http:', 'https:'].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : date.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

export function formatPrice(
  price: string | null,
  currency: string,
): string {
  if (price === null || price.trim() === '') {
    return 'Sin precio';
  }

  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return 'Precio no disponible';
  }

  try {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="break-words">{message}</p>
    </div>
  );
}

export function ProductImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const validSource = safeHttpUrl(src);

  if (!validSource || failedSource === validSource) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-violet-50 text-violet-300">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }

  return (
    <img
      src={validSource}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSource(validSource)}
      className="h-full w-full object-contain"
    />
  );
}

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}

export function WishlistModal({
  title,
  children,
  onClose,
  busy = false,
  wide = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = 'hidden';

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) onClose();
      }}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm ${
        wide ? 'max-w-3xl' : 'max-w-lg'
      }`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-violet-100 bg-white px-5 py-4">
        <h2
          id={titleId}
          className="text-lg font-bold text-slate-900"
        >
          {title}
        </h2>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="rounded-xl p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  );
}
