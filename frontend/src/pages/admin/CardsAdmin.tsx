
 // src/pages/admin/CardsAdmin.tsx
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CheckCircle2, Eye, Gift, Globe, ImagePlus,
  Loader2, Lock, Pencil, Plus, RefreshCw, Search, Trash2,
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { WishlistModal as Modal } from '../../components/admin/wishlists/WishlistUI';
import { getApiError } from '../../api/http';
import { uploadCardImage } from '../../api/cards';
import { useCards } from '../../hooks/cards.hook';
import { authStorage } from '../../config/auth.storage';
import type { Card, CardCategory, CreateCard } from '../../types/cards.schema';

type Mode = 'create' | 'edit' | 'preview' | 'delete';
type Scope = 'mine' | 'public';

const categoryNames: Record<CardCategory, string> = {
  christmas: 'Navidad',
  new_year: 'Año Nuevo',
  secret_santa: 'Amigo secreto',
  custom: 'Personalizada',
};
const empty = {
  name: '', description: '', category: 'christmas' as CardCategory, isPublic: true,
};
const inputClass =
  'min-w-0 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100';

function CardImage({ card, image }: { card?: Card | null; image?: string }) {
  const src = image || card?.frontImageUrl || card?.previewImageUrl || card?.backgroundImageUrl;
  return src ? (
    <img src={src} alt={card?.name || 'Vista previa de tarjeta'}
      className="h-full w-full object-contain" loading="lazy" />
  ) : (
    <div className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl bg-red-50 text-red-400">
      <ImagePlus size={36} /> <span className="text-sm">Sin imagen</span>
    </div>
  );
}

export default function CardsAdmin() {
  const user = authStorage.getUser();
  const {
    myCards, publicCards, loading, fetchMyCards, fetchPublicCards,
    createCard, updateCard, deleteCard,
  } = useCards();

  const [scope, setScope] = useState<Scope>('mine');
  const [category, setCategory] = useState<'all' | CardCategory>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Mode | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void Promise.allSettled([fetchMyCards(), fetchPublicCards()]).then((results) => {
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length) setError('No se pudieron cargar todos los catálogos.');
    });
  }, [fetchMyCards, fetchPublicCards]);

  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const refresh = async () => {
    const results = await Promise.allSettled([fetchMyCards(), fetchPublicCards()]);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length) setError('La operación se realizó, pero no fue posible refrescar todos los listados.');
  };

  const visible = useMemo(() => {
    const cards = scope === 'mine' ? myCards : publicCards;
    const query = search.trim().toLocaleLowerCase('es');
    return cards.filter((card) =>
      (category === 'all' || card.category === category) &&
      `${card.name} ${card.description ?? ''}`.toLocaleLowerCase('es').includes(query),
    ).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [scope, myCards, publicCards, category, search]);

  const openCreate = () => {
    setSelected(null); setImage(null); setCreatedDraftId(null);
    setForm({ ...empty }); setError(''); setModal('create');
  };
  const openFor = (mode: Exclude<Mode, 'create'>, card: Card) => {
    setSelected(card); setImage(null); setCreatedDraftId(null);
    setForm({ name: card.name, description: card.description ?? '',
      category: card.category, isPublic: card.isPublic });
    setError(''); setModal(mode);
  };
  const close = () => {
    if (busy) return;
    setModal(null); setSelected(null); setImage(null); setCreatedDraftId(null); setError('');
  };

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || loading) return;
    setError('');
    if (!form.name.trim()) { setError('Escribe el nombre de la tarjeta.'); return; }
    if (modal === 'create' && !image) {
      setError('Selecciona la imagen que se utilizará en toda la tarjeta.');
      return;
    }
    if (modal === 'edit' && !image && !selected?.frontImageUrl &&
      !selected?.previewImageUrl && !selected?.backgroundImageUrl) {
      setError('Debes agregar una imagen a la tarjeta.'); return;
    }
    if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024)) {
      setError('La imagen debe ser JPG, PNG o WEBP y pesar como máximo 5 MB.');
      return;
    }
    const data: CreateCard = {
      name: form.name.trim(), description: form.description.trim(),
      category: form.category, isPublic: form.isPublic,
    };
    setBusy(true);
    try {
      // La tarjeta nueva permanece privada hasta que su única imagen esté cargada.
      // Guardar el ID evita crear duplicados si Cloudinary falla y se reintenta.
      const card = modal === 'edit' && selected
        ? await updateCard(selected.id, { ...data, isPublic: image ? false : data.isPublic })
        : createdDraftId
          ? await updateCard(createdDraftId, { ...data, isPublic: false })
          : await createCard({ ...data, isPublic: false });

      if (modal === 'create' && !createdDraftId) setCreatedDraftId(card.id);
      if (image) {
        try {
          await uploadCardImage(card.id, 'front', image);
        } catch (cause) {
          throw new Error(`La tarjeta quedó privada; falló la imagen. Puedes pulsar Guardar otra vez sin duplicarla: ${getApiError(cause)}`);
        }
      }
      if (image || modal === 'create') {
        await updateCard(card.id, { isPublic: data.isPublic });
      }
      setModal(null); setSelected(null); setImage(null); setCreatedDraftId(null);
      setScope('mine'); setSearch(''); setCategory('all');
      setNotice(form.isPublic
        ? 'Tarjeta guardada como pública. Aparecerá en el catálogo si está activa.'
        : 'Tarjeta guardada como privada.');
      await refresh();
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try {
      await deleteCard(selected.id);
      setNotice('Tarjeta eliminada correctamente.');
      closeModalAfterDeletion();
      await refresh();
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };
  const closeModalAfterDeletion = () => {
    setModal(null); setSelected(null); setImage(null); setCreatedDraftId(null);
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#fff9f7]">
      <AdminSidebar />
      <main className="w-full min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-red-950 to-red-700 p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-rose-200">Panel administrativo</p>
              <h1 className="mt-2 text-3xl font-black">Tarjetas</h1>
              <p className="mt-2 text-sm text-red-100">Un diseño, una imagen y una publicación sencilla.</p>
            </div>
            <button type="button" onClick={openCreate}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-red-800 hover:bg-red-50">
              <Plus size={19} /> Nueva tarjeta
            </button>
          </header>

          {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><CheckCircle2 size={18}/>{notice}</p>}
          {error && !modal && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              ['Total de tarjetas', myCards.length],
              ['Públicas y activas', myCards.filter((c) => c.isPublic && c.isActive).length],
              ['Privadas', myCards.filter((c) => !c.isPublic).length],
            ].map(([label, amount]) => (
              <article key={label} className="min-w-0 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-red-950">{amount}</p>
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setScope('mine')} type="button"
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${scope === 'mine' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700'}`}>Mis tarjetas</button>
              <button onClick={() => setScope('public')} type="button"
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${scope === 'public' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700'}`}>Catálogo público</button>
            </div>
            <label className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarjeta..."
                className={`${inputClass} pl-10`} />
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}
              aria-label="Filtrar categoría" className={`${inputClass} sm:max-w-48`}>
              <option value="all">Todas las categorías</option>
              {Object.entries(categoryNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" aria-label="Actualizar" onClick={() => void refresh()} className="rounded-xl border border-red-200 p-3 text-red-700 hover:bg-red-50"><RefreshCw size={18}/></button>
          </section>

          {loading && <p className="py-10 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 animate-spin"/>Cargando tarjetas...</p>}
          {!loading && visible.length === 0 && <p className="rounded-2xl border border-dashed border-red-200 bg-white p-10 text-center text-sm text-slate-500">No hay tarjetas con estos filtros.</p>}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((card) => (
              <article key={card.id} className="min-w-0 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
                <div className="h-52 bg-red-50 p-3"><CardImage card={card} /></div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-lg bg-red-50 px-2 py-1 text-red-800">{categoryNames[card.category]}</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-slate-700">
                      {card.isPublic ? <Globe size={13}/> : <Lock size={13}/>}
                      {card.isPublic ? 'Pública' : 'Privada'}
                    </span>
                    {!card.isActive && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">Inactiva</span>}
                  </div>
                  <h2 className="break-words text-lg font-black text-red-950">{card.name}</h2>
                  <p className="line-clamp-2 text-sm text-slate-500">{card.description || 'Sin descripción'}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" onClick={() => openFor('preview', card)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-800"><Eye size={16}/> Ver</button>
                    {card.creatorId === user.id && <>
                      <button type="button" onClick={() => openFor('edit', card)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700"><Pencil size={16}/> Editar</button>
                      <button type="button" onClick={() => openFor('delete', card)} className="ml-auto rounded-xl p-2 text-red-700 hover:bg-red-50" aria-label="Eliminar tarjeta"><Trash2 size={18}/></button>
                    </>}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>

        {modal && <Modal
          title={modal === 'create' ? 'Nueva tarjeta' : modal === 'edit' ? 'Editar tarjeta' : modal === 'preview' ? 'Vista previa' : 'Eliminar tarjeta'}
          busy={busy} wide={modal !== 'delete'} onClose={close}>
          {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {(modal === 'create' || modal === 'edit') && (
            <form onSubmit={save} className="grid min-w-0 gap-6 md:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <label className="block space-y-2 text-sm font-bold text-slate-700">Nombre de la tarjeta *
                  <input required autoFocus maxLength={120} value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. ¡Feliz Navidad!" className={inputClass}/>
                </label>
                <label className="block space-y-2 text-sm font-bold text-slate-700">Categoría
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CardCategory })} className={inputClass}>
                    {Object.entries(categoryNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-bold text-slate-700">Descripción
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Un mensaje corto para describir la tarjeta" className={inputClass}/>
                </label>
                <label className="block space-y-2 text-sm font-bold text-slate-700">Imagen de la tarjeta {modal === 'create' ? '*' : '(opcional al editar)'}
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    className="block w-full min-w-0 rounded-xl border border-red-200 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-red-100 file:px-3 file:py-2 file:font-bold file:text-red-800" />
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                  <input type="checkbox" checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="h-5 w-5 accent-red-700" />
                  <span className="text-sm font-bold text-red-950">Publicar en el catálogo para todos</span>
                </label>
                <p className="text-xs leading-6 text-slate-500">Solo debes subir una imagen. El catálogo utilizará esa misma imagen para mostrar la tarjeta.</p>
              </div>
              <div className="min-w-0 space-y-4">
                <div className="overflow-hidden rounded-xl border border-red-100">
                  <div className="h-64 bg-red-50 p-3"><CardImage card={selected} image={preview} /></div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-red-700">{categoryNames[form.category]}</p>
                    <p className="mt-1 break-words text-lg font-black text-red-950">{form.name || 'Nombre de tarjeta'}</p>
                    <p className="mt-2 break-words text-sm text-slate-500">{form.description || 'Tu descripción'}</p>
                  </div>
                </div>
                <button type="submit" disabled={busy || loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 font-black text-white hover:bg-red-800 disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
                  {busy ? 'Guardando...' : 'Guardar tarjeta'}
                </button>
              </div>
            </form>
          )}
          {modal === 'preview' && selected && (
            <div className="space-y-4">
              <div className="h-72 overflow-hidden rounded-xl bg-red-50 p-3 sm:h-96"><CardImage card={selected}/></div>
              <h3 className="text-xl font-black text-red-950">{selected.name}</h3>
              <p className="text-sm leading-7 text-slate-600">{selected.description || 'Sin descripción'}</p>
              <p className="text-sm text-slate-600">{selected.isPublic ? 'Pública' : 'Privada'} · {selected.isActive ? 'Activa' : 'Inactiva'}</p>
              {selected.isPublic && !selected.isActive &&
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Esta tarjeta es pública, pero está inactiva. El backend debe activarla para que figure en el catálogo.</p>}
            </div>
          )}
          {modal === 'delete' && selected && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">¿Eliminar definitivamente <strong>{selected.name}</strong>?</p>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">Volver</button>
                <button type="button" onClick={() => void remove()} disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  <Trash2 size={17} /> Eliminar
                </button>
              </div>
            </div>
          )}
        </Modal>}
      </main>
    </div>
  );
}
