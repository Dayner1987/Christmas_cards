// src/pages/admin/SecretSantaAdmin.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Gift, ImagePlus, Loader2, Pencil,
  Plus, RefreshCw, Search, Trash2, Users,
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminGroupEvents from '../../components/admin/secretSanta/AdminGroupEvents';
import SecretSantaEventForm from '../../components/admin/secretSanta/SecretSantaEventForm';
import { ErrorNotice, WishlistModal as Modal } from '../../components/admin/wishlists/WishlistUI';
import {
  deactivateSecretSantaTemplate, getSecretSantaTemplates,
  uploadSecretSantaTemplateImage,
} from '../../api/secret_santa_events';
import { getApiError } from '../../api/http';
import type { SecretSantaTemplate } from '../../types/secret_santa_templates.schema';
import { authStorage } from '../../config/auth.storage';

const fallbackPhoto = 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1000&q=80';
const MAX_IMAGE = 5 * 1024 * 1024;

export default function SecretSantaAdmin() {
  const [view, setView] = useState<'global' | 'group'>('global');
  const [templates, setTemplates] = useState<SecretSantaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SecretSantaTemplate | null>(null);
  const [confirm, setConfirm] = useState<SecretSantaTemplate | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const data = await getSecretSantaTemplates();
    setTemplates(data);
  }, []);

  useEffect(() => {
    let active = true;
    getSecretSantaTemplates().then((data) => {
      if (active) setTemplates(data);
    }).catch((cause) => {
      if (active) setError(getApiError(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    return templates.filter((item) => `${item.name} ${item.description ?? ''}`
      .toLocaleLowerCase('es').includes(term));
  }, [templates, search]);

  const uploadCover = async (templateId: string, file?: File) => {
    if (!file || busyId) return;
    setError(''); setNotice('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > MAX_IMAGE) {
      setError('Solo puedes subir imágenes JPG, PNG o WEBP de hasta 5 MB.'); return;
    }
    setBusyId(templateId);
    try {
      await uploadSecretSantaTemplateImage(templateId, file);
      setNotice('Imagen actualizada correctamente.');
      await refresh();
    } catch (cause) { setError(getApiError(cause)); }
    finally { setBusyId(null); }
  };

  const remove = async () => {
    if (!confirm || busyId) return;
    setError(''); setBusyId(confirm.id);
    try {
      await deactivateSecretSantaTemplate(confirm.id);
      setNotice('El evento global fue desactivado. Los sorteos que ya tenían los grupos se conservan.');
      setConfirm(null);
      await refresh();
    } catch (cause) { setError(getApiError(cause)); }
    finally { setBusyId(null); }
  };

  if (authStorage.getUser()?.role !== 'admin') {
    return <main className="grid min-h-screen place-items-center text-red-900">Acceso exclusivo del administrador.</main>;
  }

  if (view === 'group') {
    return <AdminGroupEvents onBack={() => setView('global')}/>;
  }

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#fff9f7]">
      <AdminSidebar />
      <main className="min-w-0 w-full flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 to-red-700 p-6 text-white sm:p-8">
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-widest text-rose-200">Panel de administración</p>
                <h1 className="mt-2 text-3xl font-black">Eventos de Amigo Secreto</h1>
                <p className="mt-3 text-sm leading-7 text-red-100">Crea celebraciones para que todos los grupos puedan utilizarlas. Cada organizador hará su sorteo con sus propios invitados.</p>
              </div>
              <button type="button" onClick={() => { setEditing(null); setFormOpen(true); setError(''); }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-red-900 hover:bg-red-50">
                <Plus size={18}/> Crear evento global
              </button>
            </div>
          </header>

          <button type="button" onClick={() => setView('group')}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-bold text-red-700 hover:bg-red-50">
            <Users size={17}/> Administrar sorteos de grupos existentes
          </button>
          {error && <ErrorNotice message={error}/>}
          {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notice}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <CalendarDays className="text-red-600" size={25}/>
              <div><p className="text-sm text-slate-500">Eventos globales disponibles</p>
                <p className="text-2xl font-black text-red-950">{templates.length}</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <Users className="text-red-600" size={25}/>
              <div><p className="text-sm text-slate-500">Disponibles para</p>
                <p className="text-lg font-black text-red-950">Todos los grupos</p></div>
            </div>
          </div>

          <label className="relative block min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar celebraciones..."
              className="min-h-12 w-full rounded-xl border border-red-100 bg-white pl-12 pr-14 text-sm outline-none focus:border-red-500" />
            <button type="button" onClick={() => void refresh().catch((cause) => setError(getApiError(cause)))}
              aria-label="Actualizar eventos" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-red-600 hover:bg-red-50">
              <RefreshCw size={18}/>
            </button>
          </label>

          {loading ? <p className="py-10 text-center text-slate-500">Cargando eventos...</p> :
            shown.length === 0 ? <div className="rounded-2xl border border-dashed border-red-200 bg-white p-10 text-center">
              <Gift size={36} className="mx-auto text-red-300"/>
              <p className="mt-3 font-semibold text-red-950">{templates.length ? 'No hay coincidencias.' : 'Todavía no hay eventos globales.'}</p>
              <p className="mt-2 text-sm text-slate-500">Crea una celebración para ponerla a disposición de los grupos.</p>
            </div> :
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((item) => (
                  <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
                    <img src={item.imageUrl || fallbackPhoto} alt={item.name}
                      className="h-48 w-full bg-red-50 object-cover" loading="lazy"/>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">Disponible</span>
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">Global</span>
                      </div>
                      <h2 className="break-words text-lg font-black text-red-950">{item.name}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description || 'Celebración para compartir regalos con amigos.'}</p>
                      <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
                        Presupuesto: {item.budget === null ? 'Por definir' : `${item.currencyCode} ${item.budget}`}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <button type="button" onClick={() => { setEditing(item); setFormOpen(true); setError(''); }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"><Pencil size={15}/> Editar</button>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                          {busyId === item.id ? <Loader2 size={15} className="animate-spin"/> : <ImagePlus size={15}/>} Cambiar imagen
                          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={Boolean(busyId)}
                            onChange={(event) => { void uploadCover(item.id, event.target.files?.[0]); event.currentTarget.value = ''; }}/>
                        </label>
                        <button type="button" title="Desactivar evento" aria-label={`Desactivar ${item.name}`} onClick={() => setConfirm(item)}
                          className="ml-auto rounded-xl p-2 text-red-700 hover:bg-red-50"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
          }
        </div>
      </main>

      {formOpen && <SecretSantaEventForm
        key={editing?.id || 'new'} template={editing}
        onClose={() => setFormOpen(false)}
        onSaved={async () => {
          setNotice(editing ? 'Evento global actualizado.' : 'Evento global creado. Los organizadores ya pueden seleccionarlo.');
          await refresh();
        }}/>
      }
      {confirm && <Modal title="Desactivar evento global" busy={Boolean(busyId)} onClose={() => setConfirm(null)}>
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-600">¿Desactivar <strong>{confirm.name}</strong>? Dejará de aparecer entre las opciones nuevas, pero no eliminará los sorteos ya creados en otros grupos.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setConfirm(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">Volver</button>
            <button type="button" disabled={Boolean(busyId)} onClick={() => void remove()}
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Desactivar</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
