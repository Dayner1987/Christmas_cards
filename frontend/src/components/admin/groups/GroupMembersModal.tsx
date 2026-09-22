import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { LoaderCircle, Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';

import {
  addGroupMember, deleteGroupMember, getGroupMembers, updateGroupMember,
} from '../../../api/group-members';
import { getUsers } from '../../../api/users';

import type { Group } from '../../../types/group.schema';
import type { User } from '../../../types/user.schema';
import type {
  GroupMember, GroupMemberRole, MembershipStatus, UpdateGroupMember,
} from '../../../types/group_members.schema';

import GroupDialog, { groupError } from './GroupDialog';

const MEMBER_STATUS: Record<MembershipStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  rejected: 'Rechazado',
  left: 'Salió del grupo',
  removed: 'Retirado',
};

interface MemberRowProps {
  member: GroupMember;
  user?: User;
  owner: boolean;
  disabled: boolean;
  onSave: (userId: string, data: UpdateGroupMember) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

function MemberRow({
  member, user, owner, disabled, onSave, onRemove,
}: MemberRowProps) {
  const [role, setRole] = useState(member.role);
  const [status, setStatus] = useState(member.membershipStatus);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
    : `Usuario ${member.userId}`;

  const changed = role !== member.role || status !== member.membershipStatus;

  return (
    <article className="rounded-2xl border border-purple-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-bold text-purple-950">{name}</p>
          <p className="mt-1 break-all text-xs text-slate-500">{user?.email || member.userId}</p>
        </div>
        {owner && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
            <ShieldCheck size={13} /> Propietario
          </span>
        )}
      </div>

      {owner ? (
        <p className="text-sm text-slate-500">Estado: {MEMBER_STATUS[member.membershipStatus]}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-500">
            Rol
            <select
              aria-label={`Rol de ${name}`}
              disabled={disabled}
              value={role}
              onChange={event => setRole(event.target.value as GroupMemberRole)}
              className="mt-1 min-h-11 w-full rounded-xl border border-purple-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            >
              <option value="admin">Administrador</option>
              <option value="member">Miembro</option>
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-500">
            Estado
            <select
              aria-label={`Estado de ${name}`}
              disabled={disabled}
              value={status}
              onChange={event => setStatus(event.target.value as MembershipStatus)}
              className="mt-1 min-h-11 w-full rounded-xl border border-purple-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            >
              {Object.entries(MEMBER_STATUS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!owner && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || !changed}
            onClick={() => void onSave(member.userId, { role, membershipStatus: status })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-700 px-3 text-sm font-bold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
          >
            <Save size={16} /> Guardar
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setConfirmRemove(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
          >
            <Trash2 size={16} /> Quitar
          </button>
        </div>
      )}

      {confirmRemove && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-800">¿Confirmas que quieres quitar a esta persona del grupo?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setConfirmRemove(false)}
              className="min-h-11 rounded-lg bg-white px-3 text-sm font-bold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onRemove(member.userId)}
              className="min-h-11 rounded-lg bg-rose-600 px-3 text-sm font-bold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
            >
              Confirmar retiro
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function GroupMembersModal({
  group, onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');

  const lock = useRef(false);
  const archived = group.status === 'archived';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setReady(false);
    setError('');
    setWarning('');

    void Promise.allSettled([
      getGroupMembers(group.id),
      getUsers(),
    ]).then(([memberResult, userResult]) => {
      if (!active) return;

      if (memberResult.status === 'fulfilled') {
        setMembers(memberResult.value);
        setReady(true);
      } else {
        setError(groupError(memberResult.reason));
      }

      if (userResult.status === 'fulfilled') {
        setUsers(userResult.value);
      } else {
        setWarning('No se pudo cargar el directorio de usuarios. Puedes consultar los miembros por su ID.');
      }

      setLoading(false);
    });

    return () => { active = false; };
  }, [group.id, retry]);

  const userMap = useMemo(
    () => new Map(users.map(user => [user.id, user])),
    [users],
  );

  const availableUsers = useMemo(
    () => users.filter(user =>
      user.id !== group.ownerId &&
      user.status === 'active' &&
      !members.some(member => member.userId === user.id),
    ),
    [users, members, group.ownerId],
  );

  const visibleMembers = members.filter(member => {
    const user = userMap.get(member.userId);
    return [
      member.userId, user?.username, user?.email, user?.firstName, user?.lastName,
    ].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase());
  });

  const mutate = useCallback(async (
    operation: () => Promise<void>,
    message: string,
  ) => {
    if (lock.current) return;

    lock.current = true;
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await operation();
      setNotice(message);
    } catch (cause) {
      setError(groupError(cause));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }, []);

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || archived || !ready) return;

    await mutate(async () => {
      const created = await addGroupMember(group.id, { userId, role: newRole });
      setMembers(current => [...current.filter(member => member.userId !== created.userId), created]);
      setUserId('');
      setNewRole('member');
    }, 'Miembro agregado correctamente.');
  };

  const save = async (id: string, data: UpdateGroupMember) => {
    if (archived || id === group.ownerId) return;

    await mutate(async () => {
      const updated = await updateGroupMember(group.id, id, data);
      setMembers(current => current.map(member => member.userId === id ? updated : member));
    }, 'Miembro actualizado correctamente.');
  };

  const remove = async (id: string) => {
    if (archived || id === group.ownerId) return;

    await mutate(async () => {
      await deleteGroupMember(group.id, id);
      setMembers(current => current.filter(member => member.userId !== id));
    }, 'Miembro retirado del grupo.');
  };

  return (
    <GroupDialog title={`Miembros · ${group.name}`} busy={saving} onClose={onClose}>
      {archived && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          El grupo está archivado. Sus miembros se muestran en modo consulta.
        </p>
      )}

      {!archived && (
        <form onSubmit={add} className="mb-5 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
          <h3 className="mb-3 font-bold text-purple-950">Agregar miembro</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              aria-label="Usuario que se agregará"
              required
              disabled={loading || saving || !ready}
              value={userId}
              onChange={event => setUserId(event.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-purple-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            >
              <option value="">Seleccionar usuario</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>{user.username} · {user.email}</option>
              ))}
            </select>
            <select
              aria-label="Rol del nuevo miembro"
              value={newRole}
              disabled={loading || saving || !ready}
              onChange={event => setNewRole(event.target.value as 'admin' | 'member')}
              className="min-h-11 rounded-xl border border-purple-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            >
              <option value="member">Miembro</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={loading || saving || !ready || !userId}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-bold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
            >
              <Plus size={17} /> Agregar
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Los usuarios con una membresía existente se administran en el listado inferior.
          </p>
        </form>
      )}

      {warning && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{warning}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <label className="mb-4 flex items-center gap-2 rounded-xl border border-purple-200 px-3 text-purple-500 focus-within:ring-2 focus-within:ring-purple-300">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Buscar miembros"
          placeholder="Buscar miembro…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          className="min-h-11 w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none"
        />
      </label>

      {loading ? (
        <p role="status" className="flex items-center gap-2 py-6 text-sm text-purple-700">
          <LoaderCircle size={18} className="motion-safe:animate-spin" /> Cargando miembros…
        </p>
      ) : !ready ? (
        <button
          type="button"
          onClick={() => setRetry(value => value + 1)}
          className="min-h-11 rounded-xl bg-purple-100 px-4 text-sm font-bold text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          Reintentar
        </button>
      ) : (
        <div className="space-y-3">
          {visibleMembers.map(member => (
            <MemberRow
              key={`${member.id}:${member.updatedAt}:${member.role}:${member.membershipStatus}`}
              member={member}
              user={userMap.get(member.userId)}
              owner={member.userId === group.ownerId || member.role === 'owner'}
              disabled={saving || archived}
              onSave={save}
              onRemove={remove}
            />
          ))}
          {!visibleMembers.length && (
            <p className="py-8 text-center text-sm text-slate-500">No hay miembros para mostrar.</p>
          )}
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-purple-100 pt-4">
        <p className="text-xs text-slate-500">{ready ? `${members.length} membresías registradas` : 'Listado no disponible'}</p>
        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          className="min-h-11 rounded-xl border border-purple-200 px-5 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
        >
          Cerrar
        </button>
      </footer>
    </GroupDialog>
  );
}