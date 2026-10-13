import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';

import type {
  CreateWishlist,
  Wishlist,
  WishlistVisibility,
} from '../../../types/wishlists.schema';

import {
  ErrorNotice,
  getErrorMessage,
  WishlistModal,
} from './WishlistUI';

interface Props {
  wishlist: Wishlist | null;
  busy: boolean;
  onClose: () => void;
  onSave: (data: CreateWishlist) => Promise<void>;
}

export default function WishlistFormModal({
  wishlist,
  busy,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(wishlist?.name ?? '');
  const [description, setDescription] = useState(
    wishlist?.description ?? '',
  );
  const [visibility, setVisibility] = useState<WishlistVisibility>(
    wishlist?.visibility ?? 'private',
  );
  const [isDefault, setIsDefault] = useState(
    wishlist?.isDefault ?? false,
  );
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    setError('');

    if (!name.trim()) {
      setError('Escribe el nombre de la lista.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        visibility,
        isDefault,
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <WishlistModal
      title={wishlist ? 'Editar lista de deseos' : 'Nueva lista de deseos'}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorNotice message={error} />}

        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Nombre *
            </span>

            <input
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Mis regalos de Navidad"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Descripción
            </span>

            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="¿Qué te gustaría recibir?"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Visibilidad
            </span>

            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as WishlistVisibility)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            >
              <option value="private">Privada</option>
              <option value="groups">Grupos</option>
              <option value="public">Pública</option>
            </select>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              className="mt-1 h-4 w-4 accent-red-600"
            />

            <span>
              <span className="block text-sm font-semibold text-red-900">
                Lista predeterminada
              </span>
              <span className="mt-1 block text-xs leading-5 text-red-700">
                Utilizar esta lista como principal.
              </span>
            </span>
          </label>
        </fieldset>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {busy ? 'Guardando...' : 'Guardar lista'}
          </button>
        </footer>
      </form>
    </WishlistModal>
  );
}