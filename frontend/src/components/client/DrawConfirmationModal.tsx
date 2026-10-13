
 // src/components/client/DrawConfirmationModal.tsx

import {
  AlertTriangle,
  Gift,
  Shuffle,
  X,
} from 'lucide-react';

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DrawConfirmationModal({
  open,
  loading,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="draw-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/70 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-red-900 to-red-600 p-8 text-center text-white">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/15">
            <Gift size={42} />
          </div>

          <h2
            id="draw-modal-title"
            className="mt-5 text-2xl font-black"
          >
            ¿Listos para el sorteo?
          </h2>

          <p className="mt-2 text-sm text-red-100">
            La sorpresa está por comenzar.
          </p>
        </div>

        <div className="p-7">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle
              size={22}
              className="shrink-0 text-amber-700"
            />

            <p className="text-sm leading-6 text-amber-950">
              Asegúrate de que todos tus amigos estén
              dentro del grupo. Una vez realizado el sorteo,
              las parejas quedarán guardadas y no podrás
              repetirlo desde esta opción.
            </p>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Cada participante descubrirá en privado
            a quién debe entregar su regalo.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-12 cursor-pointer rounded-xl border border-red-200 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Shuffle size={17} />
              {loading ? 'Sorteando...' : 'Sortear ahora'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar advertencia"
          className="absolute right-4 top-4 cursor-pointer rounded-lg p-2 text-white/80 transition hover:bg-white/15"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
