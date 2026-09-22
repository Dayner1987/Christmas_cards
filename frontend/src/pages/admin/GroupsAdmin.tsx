import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, CheckCircle2, ChevronLeft, ChevronRight, Copy,
  Globe, Link2, LoaderCircle, LockKeyhole, Pencil, Plus,
  RefreshCw, Search, ShieldCheck, Trash2, Users, X,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';
import GroupModal from '../../components/admin/groups/GroupModal';
import GroupMembersModal from '../../components/admin/groups/GroupMembersModal';
import {
  GroupConfirmModal, groupError,
} from '../../components/admin/groups/GroupDialog';

import {
  archiveGroup, createGroup, deleteGroup, getGroups,
  updateGroup, updateGroupInvitation,
} from '../../api/groups';

import { authStorage } from '../../config/auth.storage';
import type { CreateGroup, Group } from '../../types/group.schema';

type ModalState =
  | { type: 'create' }
  | { type: 'edit' | 'members' | 'archive' | 'delete' | 'invitation'; group: Group }
  | null;

const JOIN_LABELS = {
  link: 'Mediante enlace',
  approval: 'Requiere aprobación',
  closed: 'Cerrado',
};

const PAGE_SIZE = 9;

function GroupImage({ group }: { group: Group }) {
  const [failed, setFailed] = useState('');

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-purple-600">
      {group.imageUrl && group.imageUrl !== failed ? (
        <img
          src={group.imageUrl}
          alt={`Imagen de ${group.name}`}
          onError={() => setFailed(group.imageUrl ?? '')}
          className="h-full w-full object-cover"
        />
      ) : <Users size={25} aria-hidden="true" />}
    </div>
  );
}

export default function GroupsAdmin() {
  const [, refreshSession] = useState(0);

  useEffect(() => {
    const refresh = () => refreshSession(value => value + 1);
    window.addEventListener('profile:updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('profile:updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const user = authStorage.getUser();

  if (!authStorage.isAuthenticated() || user?.role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6">
        <section className="text-center">
          <ShieldCheck size={44} className="mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-black text-purple-950">Acceso restringido</h1>
          <p className="mt-3 text-sm text-slate-500">Esta sección requiere una cuenta administradora.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <GroupsContent />
      </div>
    </div>
  );
}

function GroupsContent() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);

  const loadLock = useRef(false);

  const load = useCallback(async () => {
    if (loadLock.current) return;

    loadLock.current = true;
    setLoading(true);
    setLoadError('');

    try {
      const data = await getGroups();
      setGroups(data);
      setLoaded(true);
    } catch (cause) {
      setLoadError(groupError(cause));
    } finally {
      loadLock.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalize = (value: string) =>
      value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const search = normalize(query.trim());

    return groups.filter(group =>
      (!status || group.status === status) &&
      (!visibility || group.visibility === visibility) &&
      normalize(`${group.name} ${group.description ?? ''}`).includes(search),
    ).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }, [groups, query, status, visibility]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleGroups = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const open = (next: ModalState) => {
    setActionError('');
    setNotice('');
    setModal(next);
  };

  const replace = (updated: Group) => {
    setGroups(current => current.map(group => group.id === updated.id ? updated : group));
  };

  const save = async (data: CreateGroup) => {
    if (modal?.type === 'create') {
      const created = await createGroup(data);
      setGroups(current => [created, ...current.filter(group => group.id !== created.id)]);
      setQuery('');
      setStatus('');
      setVisibility('');
      setPage(1);
      setNotice('Grupo creado correctamente.');
    } else if (modal?.type === 'edit') {
      replace(await updateGroup(modal.group.id, data));
      setNotice('Grupo actualizado correctamente.');
    }
  };

  const confirm = async () => {
    if (!modal || modal.type === 'create' || modal.type === 'edit' || modal.type === 'members') return;

    if (modal.type === 'archive') {
      replace(await archiveGroup(modal.group.id));
      setNotice('Grupo archivado correctamente.');
    } else if (modal.type === 'delete') {
      await deleteGroup(modal.group.id);
      setGroups(current => current.filter(group => group.id !== modal.group.id));
      setNotice('Grupo eliminado correctamente.');
    } else {
      replace(await updateGroupInvitation(modal.group.id));
      setNotice('Invitación actualizada. Ya puedes copiar el enlace o código devuelto por el servidor.');
    }
  };

  const copyInvitation = async (group: Group) => {
    const value = group.invitationUrl || group.invitationCode;
    if (!value) return;

    setActionError('');
    setNotice('');

    try {
      if (!navigator.clipboard) {
        throw new Error('El portapapeles no está disponible. Selecciona y copia la invitación que aparece en la tarjeta.');
      }
      await navigator.clipboard.writeText(value);
      setNotice(`${group.invitationUrl ? 'Enlace' : 'Código'} de invitación copiado.`);
    } catch (cause) {
      setActionError(groupError(cause));
    }
  };

  return (
    <main className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-500">ChristmasCards · Administración</p>
            <h1 className="text-3xl font-black text-purple-950 sm:text-4xl">Grupos</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Organiza tus comunidades, sus miembros e invitaciones.</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => open({ type: 'create' })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            <Plus size={19} /> Crear grupo
          </button>
        </header>

        <section aria-label="Resumen de grupos" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Total de grupos', value: groups.length, icon: Users },
            { label: 'Grupos activos', value: groups.filter(group => group.status === 'active').length, icon: CheckCircle2 },
            { label: 'Archivados', value: groups.filter(group => group.status === 'archived').length, icon: Archive },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5">
              <span className="rounded-2xl bg-purple-50 p-3 text-purple-600"><Icon size={24} /></span>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-3xl font-black text-purple-950">{loaded ? value : '—'}</p>
              </div>
            </article>
          ))}
        </section>

        {notice && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" />
            <p className="flex-1">{notice}</p>
            <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice('')} className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><X size={16} /></button>
          </div>
        )}

        {(loadError || actionError) && (
          <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p>{loadError || actionError}</p>
            {loadError && (
              <button type="button" disabled={loading} onClick={() => void load()} className="mt-3 min-h-11 rounded-lg bg-white px-4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40">
                Reintentar
              </button>
            )}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
          <label className="flex min-h-12 min-w-0 basis-full items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 text-purple-500 focus-within:ring-2 focus-within:ring-purple-300 lg:flex-1 lg:basis-64">
            <Search size={18} className="shrink-0" />
            <input
              aria-label="Buscar grupos"
              placeholder="Buscar por nombre o descripción…"
              value={query}
              onChange={event => { setQuery(event.target.value); setPage(1); }}
              className="min-h-11 w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={event => { setStatus(event.target.value); setPage(1); }}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-purple-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-300 lg:flex-none"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </select>
          <select
            aria-label="Filtrar por visibilidad"
            value={visibility}
            onChange={event => { setVisibility(event.target.value); setPage(1); }}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-purple-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-300 lg:flex-none"
          >
            <option value="">Toda visibilidad</option>
            <option value="private">Privados</option>
            <option value="public">Públicos</option>
          </select>
          <button
            type="button"
            aria-label="Actualizar grupos"
            disabled={loading}
            onClick={() => void load()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-white text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
          >
            <RefreshCw size={19} className={loading ? 'motion-safe:animate-spin' : ''} />
          </button>
        </div>

        {loading && (
          <p role="status" className="mb-5 flex items-center gap-2 text-sm text-purple-700">
            <LoaderCircle size={18} className="motion-safe:animate-spin" /> Cargando grupos…
          </p>
        )}

        <section aria-label="Listado de grupos" aria-busy={loading} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map(group => (
            <article key={group.id} className="flex min-w-0 flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <GroupImage group={group} />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-black text-purple-950">{group.name}</h2>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                    group.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {group.status === 'active' ? 'Activo' : 'Archivado'}
                  </span>
                </div>
              </div>

              <p className="mb-4 line-clamp-3 break-words text-sm leading-6 text-slate-500">{group.description || 'Sin descripción.'}</p>

              <div className="mb-4 space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  {group.visibility === 'public' ? <Globe size={15} className="text-purple-500" /> : <LockKeyhole size={15} className="text-purple-500" />}
                  {group.visibility === 'public' ? 'Público' : 'Privado'} · {JOIN_LABELS[group.joinMode]}
                </p>
                <p>Capacidad: {group.maximumMembers === null ? 'sin límite configurado' : `${group.maximumMembers} miembros`}</p>
                <p>Invitación: {group.invitationEnabled ? 'habilitada' : 'deshabilitada'}</p>
                {group.invitationExpiresAt && (
                  <p>Vencimiento: {new Date(group.invitationExpiresAt).toLocaleString('es-BO')}</p>
                )}
              </div>

              {(group.invitationUrl || group.invitationCode) && (
                <div className="mb-4 rounded-xl bg-purple-50 p-3">
                  <p className="mb-1 text-xs font-bold text-purple-800">{group.invitationUrl ? 'Enlace de invitación' : 'Código de invitación'}</p>
                  <p className="select-all break-all text-xs leading-5 text-purple-600">{group.invitationUrl || group.invitationCode}</p>
                  <button
                    type="button"
                    onClick={() => void copyInvitation(group)}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-bold text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <Copy size={14} /> Copiar
                  </button>
                </div>
              )}

              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-purple-100 pt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => open({ type: 'members', group })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-3 text-sm font-bold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  <Users size={16} /> Miembros
                </button>
                <button
                  type="button"
                  disabled={loading || group.status === 'archived'}
                  onClick={() => open({ type: 'edit', group })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-200 px-3 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  <Pencil size={16} /> Editar
                </button>
                <button
                  type="button"
                  disabled={loading || group.status === 'archived'}
                  onClick={() => open({ type: 'invitation', group })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-50 px-3 text-xs font-bold text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  <Link2 size={15} /> Renovar invitación
                </button>
                <button
                  type="button"
                  disabled={loading || group.status === 'archived'}
                  onClick={() => open({ type: 'archive', group })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  <Archive size={15} /> Archivar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => open({ type: 'delete', group })}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
                >
                  <Trash2 size={15} /> Eliminar grupo
                </button>
              </div>
            </article>
          ))}
        </section>

        {!loading && loaded && !visibleGroups.length && (
          <div className="rounded-3xl border border-dashed border-purple-200 px-5 py-16 text-center">
            <Users size={42} className="mx-auto mb-4 text-purple-300" />
            <h2 className="text-xl font-bold text-purple-950">No hay grupos para mostrar</h2>
            <p className="mt-2 text-sm text-slate-500">Crea un grupo o modifica los filtros.</p>
            {(query || status || visibility) && (
              <button
                type="button"
                onClick={() => { setQuery(''); setStatus(''); setVisibility(''); setPage(1); }}
                className="mt-4 min-h-11 rounded-xl bg-purple-50 px-4 text-sm font-bold text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{filtered.length} resultados · Página {currentPage} de {pages}</p>
          <nav aria-label="Paginación de grupos" className="flex gap-2">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-30"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-30"
            >
              <ChevronRight size={19} />
            </button>
          </nav>
        </footer>
      </div>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <GroupModal
          key={modal.type === 'edit' ? modal.group.id : 'create'}
          group={modal.type === 'edit' ? modal.group : null}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}

      {modal?.type === 'members' && (
        <GroupMembersModal
          key={modal.group.id}
          group={modal.group}
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === 'archive' || modal?.type === 'delete' || modal?.type === 'invitation') && (
        <GroupConfirmModal
          title={modal.type === 'delete' ? 'Eliminar grupo' : modal.type === 'archive' ? 'Archivar grupo' : 'Renovar invitación'}
          message={
            modal.type === 'delete'
              ? `¿Confirmas que quieres eliminar el grupo “${modal.group.name}”?`
              : modal.type === 'archive'
                ? `¿Quieres archivar “${modal.group.name}”? En este panel quedará disponible para consulta.`
                : `¿Quieres renovar la invitación de “${modal.group.name}”? Se solicitará una nueva invitación al servidor; el enlace o código anterior podría dejar de funcionar.`
          }
          confirmLabel={modal.type === 'delete' ? 'Sí, eliminar' : modal.type === 'archive' ? 'Sí, archivar' : 'Renovar invitación'}
          danger={modal.type === 'delete'}
          onClose={() => setModal(null)}
          onConfirm={confirm}
        />
      )}
    </main>
  );
}