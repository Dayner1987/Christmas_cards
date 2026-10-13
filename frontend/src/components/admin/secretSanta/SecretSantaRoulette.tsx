import { useRef, useState } from 'react';
import {
  Check,
  Gift,
  Loader2,
  LockKeyhole,
  PartyPopper,
  Sparkles,
} from 'lucide-react';

import {
  ErrorNotice,
  getErrorMessage,
  WishlistModal as Modal,
} from '../wishlists/WishlistUI';

export interface DrawResult {
  count?: number;
  message: string;
}

interface Props {
  eventName: string;
  onDraw: () => Promise<DrawResult>;
  onClose: () => void;
}

const symbols = ['🎁', '❓', '🎄', '✨', '🎁', '❓', '🎉', '⭐'];

export default function SecretSantaRoulette({
  eventName,
  onDraw,
  onClose,
}: Props) {
  const requestLock = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState('');

  const startDraw = async () => {
    if (requestLock.current || attempted) return;

    requestLock.current = true;
    setAttempted(true);
    setSpinning(true);
    setError('');

    try {
      const response = await onDraw();
      setResult(response);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSpinning(false);
      requestLock.current = false;
    }
  };

  return (
    <Modal
      title="La ruleta del amigo secreto"
      busy={spinning}
      onClose={onClose}
    >
      <div className="space-y-6 text-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <Sparkles className="h-3.5 w-3.5" />
            {result ? 'Sorteo confirmado' : 'Que comience la sorpresa'}
          </span>

          <h3 className="mt-3 break-words text-xl font-bold text-slate-900">
            {eventName}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {result
              ? 'Las asignaciones están registradas en el servidor.'
              : 'Pulsa el botón para solicitar la asignación automática del grupo.'}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72"
        >
          <div className="absolute -inset-3 rounded-full bg-red-100/60" />

          <div className="absolute -top-3 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-l-[13px] border-r-[13px] border-t-[24px] border-l-transparent border-r-transparent border-t-rose-500 drop-shadow-md" />

          <div
            className={`absolute inset-0 overflow-hidden rounded-full border-[7px] border-white shadow-xl shadow-red-200 ${
              spinning
                ? 'animate-spin [animation-duration:1.4s] motion-reduce:animate-none'
                : ''
            }`}
            style={{
              background:
                'conic-gradient(#b91c1c 0deg 45deg, #fee2e2 45deg 90deg, #ef4444 90deg 135deg, #fecaca 135deg 180deg, #991b1b 180deg 225deg, #fee2e2 225deg 270deg, #ef4444 270deg 315deg, #fecaca 315deg 360deg)',
            }}
          >
            {symbols.map((symbol, index) => {
              const angle = index * 45 + 22.5;

              return (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 flex h-9 w-9 items-center justify-center text-2xl"
                  style={{
                    transform:
                      `translate(-50%, -50%) rotate(${angle}deg) ` +
                      `translateY(-88px) rotate(-${angle}deg)`,
                  }}
                >
                  {symbol}
                </span>
              );
            })}
          </div>

          <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-red-100 bg-white text-red-600 shadow-lg">
            {result ? (
              <Check className="h-9 w-9 text-emerald-500" />
            ) : (
              <Gift className="h-9 w-9" />
            )}
          </div>
        </div>

        <div aria-live="polite">
          {spinning && (
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-red-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando el evento y realizando el sorteo...
            </p>
          )}

          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <PartyPopper className="mx-auto h-8 w-8" />
              <h4 className="mt-2 text-lg font-bold">
                ¡El amigo secreto está listo!
              </h4>

              {result.count !== undefined && (
                <p className="mt-1 text-sm font-semibold">
                  {result.count} asignaciones confirmadas
                </p>
              )}

              <p className="mt-2 text-sm leading-6">{result.message}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="space-y-3 text-left">
            <ErrorNotice message={error} />
            <p className="text-xs leading-5 text-slate-500">
              Cierra esta ventana y actualiza los eventos para comprobar
              el estado. No se repetirá la petición automáticamente.
            </p>
          </div>
        )}

        {!attempted ? (
          <button
            type="button"
            onClick={() => void startDraw()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:from-red-700 hover:to-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
          >
            <Sparkles className="h-5 w-5" />
            Girar y asignar amigos
          </button>
        ) : (
          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            className="w-full rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {spinning ? 'Sorteo en proceso...' : 'Volver a los eventos'}
          </button>
        )}

        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          Las parejas no se muestran en esta pantalla.
        </p>
      </div>
    </Modal>
  );
}