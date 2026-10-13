import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';

import type {
  CreateWishlistItem,
  WishlistItem,
  WishlistItemPriority,
} from '../../../types/wishlist_items.schema';

import {
  ErrorNotice,
  getErrorMessage,
  ProductImage,
  safeHttpUrl,
  WishlistModal,
} from './WishlistUI';

interface Props {
  item: WishlistItem | null;
  busy: boolean;
  onClose: () => void;
  onSave: (
    data: CreateWishlistItem,
    isReceived: boolean,
    imageFile?: File,
  ) => Promise<void>;
}

export default function WishlistItemFormModal({
  item,
  busy,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    productUrl: item?.productUrl ?? '',
    imageUrl: item?.imageUrl ?? '',
    estimatedPrice: item?.estimatedPrice ?? '',
    currencyCode: item?.currencyCode ?? 'BOB',
    quantity: String(item?.quantity ?? 1),
    priority: item?.priority ?? 'medium',
    isReceived: item?.isReceived ?? false,
  });

  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    setError('');

    const name = form.name.trim();
    const productUrl = form.productUrl.trim();
    const estimatedPrice = form.estimatedPrice.trim();
    const currencyCode = form.currencyCode.trim().toUpperCase();
    const quantity = Number(form.quantity);

    if (!name) {
      setError('Escribe el nombre del producto.');
      return;
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setError('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    if (
      estimatedPrice &&
      (
        !/^\d+(\.\d+)?$/.test(estimatedPrice) ||
        !Number.isFinite(Number(estimatedPrice))
      )
    ) {
      setError('Escribe un precio válido, por ejemplo 150.50.');
      return;
    }

    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      setError('La moneda debe tener tres letras, por ejemplo BOB o USD.');
      return;
    }

    if (
      (productUrl && !safeHttpUrl(productUrl))
    ) {
      setError('Los enlaces deben ser URLs válidas con http o https.');
      return;
    }

    if (
      item &&
      (
        (item.productUrl && !productUrl) ||
        (item.estimatedPrice !== null &&
          item.estimatedPrice !== '' &&
          !estimatedPrice)
      )
    ) {
      setError(
        'Para quitar enlaces o precios existentes se requiere una operación específica.',
      );
      return;
    }

    const data: CreateWishlistItem = {
      name,
      description: form.description.trim(),
      currencyCode,
      quantity,
      priority: form.priority,
      ...(productUrl ? { productUrl } : {}),
      ...(estimatedPrice ? { estimatedPrice } : {}),
    };

    try {
      await onSave(data, form.isReceived, imageFile);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <WishlistModal
      title={item ? 'Editar producto' : 'Agregar producto'}
      onClose={onClose}
      busy={busy}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorNotice message={error} />}

        <fieldset
          disabled={busy}
          className="grid min-w-0 gap-5 disabled:opacity-60 md:grid-cols-2"
        >
          <div className="min-w-0 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre del producto *
              </span>
              <input
                autoFocus
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Ej. Audífonos inalámbricos"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Descripción
              </span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Color, talla, modelo o detalles..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Precio unitario
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.estimatedPrice}
                  onChange={(event) =>
                    setForm({ ...form, estimatedPrice: event.target.value })
                  }
                  placeholder="150.00"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Moneda *
                </span>
                <input
                  required
                  maxLength={3}
                  value={form.currencyCode}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      currencyCode: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="BOB"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm uppercase outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Cantidad *
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Prioridad
                </span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as WishlistItemPriority,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </label>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="aspect-video overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-3">
              <ProductImage
                src={form.imageUrl}
                alt={form.name || 'Vista previa del producto'}
              />
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Foto del producto (Cloudinary)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={event => setImageFile(event.target.files?.[0])}
                className="block w-full rounded-xl border border-red-200 bg-white p-3 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-red-700" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Enlace del producto</span>
              <input type="url" value={form.productUrl}
                onChange={event => setForm({ ...form, productUrl: event.target.value })}
                placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" />
            </label>

            {item && (
              <label className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                <input
                  type="checkbox"
                  checked={form.isReceived}
                  onChange={(event) =>
                    setForm({ ...form, isReceived: event.target.checked })
                  }
                  className="h-4 w-4 accent-red-600"
                />
                Producto recibido
              </label>
            )}
          </div>
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
            {busy ? 'Guardando...' : 'Guardar producto'}
          </button>
        </footer>
      </form>
    </WishlistModal>
  );
}