import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowRight,
  Check,
  Gift,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
} from 'lucide-react';

import { useWishlists } from '../../../hooks/wishlist.hook';
import type {
  CreateWishlist,
  Wishlist,
} from '../../../types/wishlists.schema';

import WishlistFormModal from './WishlistFormModal';
import WishlistItemsPanel from './WishlistItemsPanel';
import {
  ErrorNotice,
  formatDate,
  getErrorMessage,
  WishlistModal,
} from './WishlistUI';

const visibilityLabels = {
  private: 'Privada',
  groups: 'Grupos',
  public: 'Pública',
};

export default function WishlistsContent() {
  const {
    wishlists,
    fetchWishlists,
    createWishlist,
    updateWishlist,
    archiveWishlist,
  } = useWishlists();

  const firstLoad = useRef(fetchWishlists);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wishlist | null>(null);
  const [confirming, setConfirming] = useState<Wishlist | null>(null);

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

  const selectedWishlist = wishlists.find(
    (wishlist) => wishlist.id === selectedId,
  );

  const filteredWishlists = wishlists.filter((wishlist) => {
    const query = search.trim().toLocaleLowerCase('es');
    const text =
      `${wishlist.name} ${wishlist.description ?? ''}`.toLocaleLowerCase('es');

    return (
      text.includes(query) &&
      (status === 'all' || wishlist.status === status)
    );
  });

  const activeCount = wishlists.filter(
    (wishlist) => wishlist.status === 'active',
  ).length;

  const refresh = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await fetchWishlists();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  // Refrescar después de guardar también sincroniza posibles cambios
  // en otras listas cuando el backend establece una predeterminada.
  const refreshAfterMutation = async () => {
    try {
      await fetchWishlists();
    } catch (caught) {
      setError(
        `El cambio se guardó, pero no se pudo actualizar el listado: ${getErrorMessage(caught)}`,
      );
    }
  };

  const saveWishlist = async (data: CreateWishlist) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (editing) {
        await updateWishlist(editing.id, data);
      } else {
        await createWishlist(data);
      }

      setFormOpen(false);
      setEditing(null);
      setSearch('');
      setStatus('all');
      setNotice(editing ? 'Lista actualizada.' : 'Lista creada.');
      await refreshAfterMutation();
    } finally {
      // El formulario presenta los errores de creación o edición.
      setBusy(false);
    }
  };

  const changeStatus = async () => {
    if (!confirming || busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (confirming.status === 'active') {
        await archiveWishlist(confirming.id);
        setNotice('Lista archivada.');
      } else {
        await updateWishlist(confirming.id, { status: 'active' });
        setNotice('Lista restaurada.');
      }

      setConfirming(null);
      await refreshAfterMutation();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (selectedWishlist) {
    return (
      <WishlistItemsPanel
        key={selectedWishlist.id}
        wishlist={selectedWishlist}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <Gift className="h-3.5 w-3.5" />
            Administración
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Listas de deseos
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Organiza listas, administra productos y registra los regalos recibidos.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setEditing(null);
            setError('');
            setFormOpen(true);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Nueva lista
        </button>
      </header>

      {error && !confirming && <ErrorNotice message={error} />}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <Check className="h-5 w-5 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Listas disponibles', value: wishlists.length },
          { label: 'Activas', value: activeCount },
          { label: 'Archivadas', value: wishlists.length - activeCount },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-red-100 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-white p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            aria-label="Buscar listas de deseos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar listas..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
          />
        </div>

        <select
          aria-label="Filtrar listas por estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-red-100"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="archived">Archivadas</option>
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          aria-label="Actualizar listas"
          className="flex items-center justify-center rounded-xl border border-red-200 p-3 text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <RefreshCw className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {busy && (
        <p role="status" className="flex items-center gap-2 text-sm text-red-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando...
        </p>
      )}

      {!busy && filteredWishlists.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-red-200 bg-red-50/40 p-10 text-center">
          <Gift className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No hay listas para mostrar
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {search || status !== 'all'
              ? 'Prueba otra búsqueda o cambia el filtro.'
              : 'Crea una lista para empezar a agregar productos.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWishlists.map((wishlist) => (
            <article
              key={wishlist.id}
              className="flex min-w-0 flex-col rounded-3xl border border-red-100 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow-md hover:shadow-red-100/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Gift className="h-6 w-6" />
                </span>

                {wishlist.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3" />
                    Principal
                  </span>
                )}
              </div>

              <h2 className="mt-4 break-words text-xl font-bold text-slate-900">
                {wishlist.name}
              </h2>

              <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-500">
                {wishlist.description || 'Sin descripción.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  {visibilityLabels[wishlist.visibility]}
                </span>

                <span
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    wishlist.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {wishlist.status === 'active' ? 'Activa' : 'Archivada'}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Creada el {formatDate(wishlist.createdAt)}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                {wishlist.status === 'active' && (
                  <button
                    type="button"
                    disabled={busy}
                    title="Editar lista"
                    aria-label={`Editar ${wishlist.name}`}
                    onClick={() => {
                      setEditing(wishlist);
                      setError('');
                      setFormOpen(true);
                    }}
                    className="rounded-xl border border-red-200 p-3 text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy}
                  title={wishlist.status === 'active' ? 'Archivar lista' : 'Restaurar lista'}
                  aria-label={`${
                    wishlist.status === 'active' ? 'Archivar' : 'Restaurar'
                  } ${wishlist.name}`}
                  onClick={() => {
                    setError('');
                    setConfirming(wishlist);
                  }}
                  className="rounded-xl border border-slate-200 p-3 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  {wishlist.status === 'active' ? (
                    <Archive className="h-4 w-4" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setSelectedId(wishlist.id)}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  Productos
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <WishlistFormModal
          wishlist={editing}
          busy={busy}
          onSave={saveWishlist}
          onClose={() => {
            if (!busy) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
        />
      )}

      {confirming && (
        <WishlistModal
          title={confirming.status === 'active' ? 'Archivar lista' : 'Restaurar lista'}
          busy={busy}
          onClose={() => {
            if (!busy) {
              setConfirming(null);
              setError('');
            }
          }}
        >
          <div className="space-y-5">
            {error && <ErrorNotice message={error} />}

            <p className="break-words text-sm leading-6 text-slate-600">
              {confirming.status === 'active'
                ? '¿Archivar esta lista? Sus productos permanecerán disponibles para consulta.'
                : '¿Restaurar esta lista para volver a gestionar sus productos?'}
            </p>

            <p className="break-words rounded-xl bg-red-50 p-4 font-semibold text-red-800">
              {confirming.name}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={() => {
                  setConfirming(null);
                  setError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void changeStatus()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirming.status === 'active' ? 'Archivar' : 'Restaurar'}
              </button>
            </div>
          </div>
        </WishlistModal>
      )}
    </section>
  );
}