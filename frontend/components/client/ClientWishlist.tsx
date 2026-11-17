
 // src/components/client/ClientWishlist.tsx

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Heart, ImagePlus, Plus, Trash2, Gift} from 'lucide-react';

import {
  createWishlist,
  getWishlists,
} from '../../api/wishlist';

import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlistItems,
  uploadWishlistItemImage,
} from '../../api/wishlist_items';

import { getApiError } from '../../api/http';

import type { Wishlist } from '../../types/wishlists.schema';
import type { WishlistItem } from '../../types/wishlist_items.schema';

export default function ClientWishlist() {
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState<WishlistItem[]>([]);

  const [listName, setListName] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadLists = async () => {
    const data = await getWishlists();
    const active = data.filter((list) => list.status === 'active');

    setLists(active);
    setSelectedId((current) =>
      active.some((list) => list.id === current)
        ? current
        : active[0]?.id ?? '',
    );
  };

  const loadItems = async (id: string) => {
    setItems(await getWishlistItems(id));
  };

  useEffect(() => {
    void loadLists().catch((cause) => setError(getApiError(cause)));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setItems([]);
      return;
    }

    let active = true;

    getWishlistItems(selectedId)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((cause) => {
        if (active) setError(getApiError(cause));
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const addList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const created = await createWishlist({
        name: listName.trim() || 'Mi lista de deseos',
        visibility: 'groups',
        isDefault: lists.length === 0,
      });

      await loadLists();
      setSelectedId(created.id);
      setListName('');
      setNotice('Lista de deseos creada.');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !name.trim() || busy) return;

    const numericPrice = price.trim() ? Number(price) : undefined;

    if (
      numericPrice !== undefined &&
      (!Number.isFinite(numericPrice) || numericPrice < 0)
    ) {
      setError('Ingresa un precio válido.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const created = await createWishlistItem(selectedId, {
        name: name.trim(),
        productUrl: productUrl.trim() || undefined,
        estimatedPrice:
          numericPrice !== undefined
            ? numericPrice.toFixed(2)
            : undefined,
        currencyCode: 'BOB',
        priority: 'medium',
        quantity: 1,
      });

      let imageError = '';

      if (image) {
        try {
          await uploadWishlistItemImage(selectedId, created.id, image);
        } catch (cause) {
          imageError = getApiError(cause);
        }
      }

      setName('');
      setPrice('');
      setProductUrl('');
      setImage(null);

      await loadItems(selectedId);

      if (imageError) {
        setError(`Deseo guardado, pero falló su imagen: ${imageError}`);
      } else {
        setNotice('Deseo agregado a tu lista.');
      }
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!selectedId || busy) return;

    if (!window.confirm('¿Eliminar este deseo de tu lista?')) return;

    setBusy(true);
    setError('');

    try {
      await deleteWishlistItem(selectedId, id);
      await loadItems(selectedId);
      setNotice('Deseo eliminado.');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
          <Heart className="text-red-600" />
          Mi lista de deseos
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Ayuda a tu amigo secreto a descubrir qué te gustaría recibir.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
          {notice}
        </p>
      )}

      <form
        onSubmit={(event) => void addList(event)}
        className="flex flex-wrap gap-3 rounded-2xl border border-red-100 bg-white p-4"
      >
        <input
          value={listName}
          onChange={(event) => setListName(event.target.value)}
          maxLength={120}
          placeholder="Nombre de una nueva lista"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-red-200 px-4 outline-none focus:border-red-600"
        />

        <button
          type="submit"
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
        >
          <Plus size={17} />
          Nueva lista
        </button>
      </form>

      {lists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => setSelectedId(list.id)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition ${
                selectedId === list.id
                  ? 'bg-red-700 text-white'
                  : 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
              }`}
            >
              {list.name}
            </button>
          ))}
        </div>
      )}

      {selectedId ? (
        <>
          <form
            onSubmit={(event) => void addItem(event)}
            className="space-y-4 rounded-3xl border border-red-100 bg-white p-5"
          >
            <h3 className="text-lg font-black text-red-950">
              Agregar un deseo
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Auriculares inalámbricos"
                required
                className="rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-600"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Precio aproximado (Bs)"
                className="rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-600"
              />
            </div>

            <input
              type="url"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="Enlace del producto (opcional)"
              className="w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-600"
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 p-4 text-sm text-red-700">
              <ImagePlus size={19} />
              {image ? image.name : 'Agregar fotografía del regalo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setImage(event.target.files?.[0] ?? null)
                }
                className="sr-only"
              />
            </label>

            <button
              disabled={busy || !name.trim()}
              className="cursor-pointer rounded-xl bg-red-700 px-6 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Guardando...' : 'Agregar a mis deseos'}
            </button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-red-50 text-red-300">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Gift size={35} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-red-950">{item.name}</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.estimatedPrice
                      ? `Bs ${item.estimatedPrice}`
                      : 'Sin precio establecido'}
                  </p>

                  {item.productUrl && (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block cursor-pointer text-sm font-bold text-red-700 hover:underline"
                    >
                      Ver producto
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    disabled={busy}
                    className="mt-3 flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-red-200 bg-white p-7 text-sm text-slate-500">
                Esta lista todavía no tiene deseos.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">
          Crea tu primera lista para comenzar a guardar tus deseos.
        </p>
      )}
    </section>
  );
}
