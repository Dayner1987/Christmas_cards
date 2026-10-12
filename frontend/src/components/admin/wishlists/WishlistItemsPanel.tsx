import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Gift,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import { useWishlistItems } from '../../../hooks/wishlist_items.hook';
import type { Wishlist } from '../../../types/wishlists.schema';
import type {
  CreateWishlistItem,
  WishlistItem,
} from '../../../types/wishlist_items.schema';

import WishlistItemFormModal from './WishlistItemFormModal';
import {
  ErrorNotice,
  formatPrice,
  getErrorMessage,
  ProductImage,
  safeHttpUrl,
  WishlistModal,
} from './WishlistUI';

interface Props {
  wishlist: Wishlist;
  onBack: () => void;
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export default function WishlistItemsPanel({ wishlist, onBack }: Props) {
  const {
    items,
    fetchItems,
    addItem,
    editItem,
    removeItem,
  } = useWishlistItems(wishlist.id);

  const firstLoad = useRef(fetchItems);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [deleting, setDeleting] = useState<WishlistItem | null>(null);

  const archived = wishlist.status === 'archived';

  useEffect(() => {
    let active = true;

    void firstLoad.current()
      .catch((caught: unknown) => {
        if (active) setError(getErrorMessage(caught));
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLocaleLowerCase('es');
    const text = `${item.name} ${item.description ?? ''}`.toLocaleLowerCase('es');

    const matchesStatus =
      filter === 'all' ||
      (filter === 'received' && item.isReceived) ||
      (filter === 'pending' && !item.isReceived);

    return matchesStatus && text.includes(query);
  });

  const received = items.filter((item) => item.isReceived).length;

  const refresh = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await fetchItems();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveItem = async (
    data: CreateWishlistItem,
    isReceived: boolean,
  ) => {
    if (busy || archived) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (editing) {
        await editItem(editing.id, { ...data, isReceived });
      } else {
        await addItem(data);
      }

      setFormOpen(false);
      setEditing(null);
      setSearch('');
      setFilter('all');
      setNotice(editing ? 'Producto actualizado.' : 'Producto agregado.');
    } finally {
      // El modal captura y muestra cualquier error de la petición.
      setBusy(false);
    }
  };

  const toggleReceived = async (item: WishlistItem) => {
    if (busy || archived) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await editItem(item.id, { isReceived: !item.isReceived });
      setNotice(
        item.isReceived
          ? 'Producto marcado como pendiente.'
          : 'Producto marcado como recibido.',
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || busy || archived) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await removeItem(deleting.id);
      setDeleting(null);
      setNotice('Producto eliminado.');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <button
        type="button"
        disabled={busy}
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a las listas
      </button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet-600">
            Lista de deseos
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold text-slate-900">
            {wishlist.name}
          </h1>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
            {wishlist.description || 'Organiza aquí los productos de esta lista.'}
          </p>
        </div>

        {!archived && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(null);
              setError('');
              setFormOpen(true);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar producto
          </button>
        )}
      </header>

      {archived && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Esta lista está archivada. Restáurala desde el listado para modificar
          sus productos.
        </p>
      )}

      {error && !deleting && <ErrorNotice message={error} />}

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Productos', value: items.length },
          { label: 'Pendientes', value: items.length - received },
          { label: 'Recibidos', value: received },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3 sm:p-5"
          >
            <p className="text-xs text-slate-500 sm:text-sm">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-violet-700">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Buscar productos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <select
          aria-label="Filtrar productos por estado"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-violet-100"
        >
          <option value="all">Todos los productos</option>
          <option value="pending">Pendientes</option>
          <option value="received">Recibidos</option>
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          aria-label="Actualizar productos"
          className="flex items-center justify-center rounded-xl border border-violet-200 p-3 text-violet-600 hover:bg-violet-50 disabled:opacity-40"
        >
          <RefreshCw className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {busy && (
        <p role="status" className="flex items-center gap-2 text-sm text-violet-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando...
        </p>
      )}

      {!busy && filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center">
          <Gift className="mx-auto h-10 w-10 text-violet-400" />
          <h2 className="mt-4 font-bold text-slate-800">
            No hay productos para mostrar
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {search || filter !== 'all'
              ? 'Cambia la búsqueda o el filtro seleccionado.'
              : 'Los productos que agregues aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const productLink = safeHttpUrl(item.productUrl);

            return (
              <article
                key={item.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-violet-50/50 p-4">
                  <ProductImage src={item.imageUrl} alt={item.name} />

                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : item.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Prioridad {priorityLabels[item.priority].toLowerCase()}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold text-violet-600">
                    {item.isReceived ? 'Recibido' : 'Pendiente'}
                  </span>

                  <h3 className="mt-2 break-words text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                    {item.description || 'Sin descripción.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-violet-700">
                      {formatPrice(item.estimatedPrice, item.currencyCode)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Cantidad: {item.quantity}
                    </span>
                  </div>

                  {productLink && (
                    <a
                      href={productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver producto
                    </a>
                  )}

                  {!archived && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Editar ${item.name}`}
                        title="Editar producto"
                        onClick={() => {
                          setEditing(item);
                          setError('');
                          setFormOpen(true);
                        }}
                        className="rounded-xl border border-violet-200 p-3 text-violet-600 hover:bg-violet-50 disabled:opacity-40"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Eliminar ${item.name}`}
                        title="Eliminar producto"
                        onClick={() => {
                          setError('');
                          setDeleting(item);
                        }}
                        className="rounded-xl border border-rose-100 p-3 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleReceived(item)}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-40"
                      >
                        <Check className="h-4 w-4" />
                        {item.isReceived ? 'Marcar pendiente' : 'Marcar recibido'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formOpen && (
        <WishlistItemFormModal
          item={editing}
          busy={busy}
          onClose={() => {
            if (!busy) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
          onSave={saveItem}
        />
      )}

      {deleting && (
        <WishlistModal
          title="Eliminar producto"
          busy={busy}
          onClose={() => {
            if (!busy) {
              setDeleting(null);
              setError('');
            }
          }}
        >
          <div className="space-y-5">
            {error && <ErrorNotice message={error} />}

            <p className="break-words text-sm leading-6 text-slate-600">
              ¿Eliminar <strong>{deleting.name}</strong> de esta lista?
              Esta acción no se puede deshacer desde esta pantalla.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={() => {
                  setDeleting(null);
                  setError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </WishlistModal>
      )}
    </section>
  );
}