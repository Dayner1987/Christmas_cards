// src/components/admin/groups/GroupMembersModal.tsx
import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, ShieldCheck, Trash2, Users, UserRoundPlus } from 'lucide-react';
import { addGroupMember, approveGroupMember, approveGuestMember, deleteGroupMember, getGroupMembers, removeGuestMember, updateGroupMember } from '../../../api/group-members';
import { addGuestToGroup } from '../../../api/groups';
import { getUsers } from '../../../api/users';
import { getApiError } from '../../../api/http';
import { api } from '../../../api/http';
import type { Group } from '../../../types/group.schema';
import type { User } from '../../../types/user.schema';
import type { GroupMember } from '../../../types/group_members.schema';
import GroupDialog from './GroupDialog';

type Pending = { memberId: string; guestName: string | null; isGuest: boolean; userId: string | null; username: string | null };
export default function GroupMembersModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    const [m, p, u] = await Promise.all([
      getGroupMembers(group.id),
      api.get<Pending[]>(`/groups/${group.id}/members/pending`).then(response => response.data),
      getUsers(),
    ]);
    setMembers(m); setPending(p); setUsers(u);
  }, [group.id]);
  useEffect(() => {
    let active = true;
    void refresh().catch(cause => { if (active) setError(getApiError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  const mutate = async (action: () => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); await refresh(); setNotice(message); }
    catch (cause) { setError(getApiError(cause)); }
    finally { setBusy(false); }
  };
  const nameOf = (member: GroupMember): string => member.isGuest
    ? (member.guestName || 'Invitado')
    : ([member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ') || member.user?.username || 'Usuario registrado');
  return <GroupDialog busy={busy} title={`Participantes · ${group.name}`} onClose={onClose}>
    <div className="space-y-5">
      {loading && <p className="text-sm text-slate-500">Cargando miembros...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {guestToken && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-950">Token privado del invitado</p><p className="mt-2 break-all font-mono text-xs">{guestToken}</p><p className="mt-2 text-xs text-amber-800">Cópialo y compártelo solamente con el invitado. No será mostrado de nuevo.</p><button onClick={() => void navigator.clipboard.writeText(guestToken)} className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-bold">Copiar token</button></section>}
      {group.status === 'active' && <>
        <section className="rounded-2xl bg-red-50 p-4"><h3 className="mb-3 flex items-center gap-2 font-black text-red-900"><UserRoundPlus size={18}/> Agregar invitado sin cuenta</h3><div className="flex flex-col gap-2 sm:flex-row"><input value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={80} placeholder="Nombre del invitado" className="min-h-11 min-w-0 flex-1 rounded-lg border border-red-200 px-3 text-sm"/><button disabled={busy || guestName.trim().length<2} onClick={() => void mutate(async () => { const g=await addGuestToGroup(group.id, guestName.trim()); setGuestToken(g.guestToken); setGuestName(''); }, 'Invitado agregado.')} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} className="inline"/> Añadir</button></div></section>
        <section><h3 className="mb-2 font-black text-red-950">Agregar usuario registrado</h3><div className="flex flex-col gap-2 sm:flex-row"><select value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-red-200 bg-white px-3 text-sm"><option value="">Selecciona un usuario</option>{users.filter(user => !members.some(m=>m.user?.id===user.id)).map(user=><option key={user.id} value={user.id}>{user.username} — {user.email}</option>)}</select><button disabled={busy || !selectedUserId} onClick={() => void mutate(async()=>{ await addGroupMember(group.id,{userId:selectedUserId,role:'member'});setSelectedUserId(''); }, 'Usuario agregado.')} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-800 disabled:opacity-50">Agregar</button></div></section>
      </>}
      {pending.length>0 && <section className="space-y-2"><h3 className="font-black text-amber-900">Solicitudes pendientes ({pending.length})</h3>{pending.map(item=><div key={item.memberId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><span className="text-sm font-bold">{item.guestName || item.username || 'Usuario'}</span><button disabled={busy} onClick={() => void mutate(() => item.isGuest ? approveGuestMember(group.id,item.memberId) : approveGroupMember(group.id,item.userId!), 'Solicitud aprobada.')} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white"><Check size={14} className="inline"/> Aprobar</button></div>)}</section>}
      <section className="space-y-2"><h3 className="flex items-center gap-2 font-black text-red-950"><Users size={19}/> Miembros activos ({members.length})</h3>{members.map(member => {
        const uid=member.user?.id;
        const owner=uid===group.ownerId || member.role==='owner';
        return <article key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-red-100 p-3">
          {member.isGuest && member.guestAvatarUrl ? <img alt="" src={member.guestAvatarUrl} className="h-10 w-10 rounded-full object-cover"/> : <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-700"><Users size={18}/></span>}
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-black">{nameOf(member)}</p><p className="text-xs text-slate-500">{member.isGuest ? 'Invitado sin cuenta' : owner ? 'Propietario' : member.role==='admin' ? 'Moderador' : 'Miembro'}</p></div>
          {!owner && group.status==='active' && <div className="flex items-center gap-2">{uid && <select disabled={busy} value={member.role} onChange={e => void mutate(()=>updateGroupMember(group.id,uid,{role:e.target.value as 'member'|'admin'}),'Rol actualizado.')} className="rounded-lg border border-red-200 bg-white px-2 py-2 text-xs"><option value="member">Miembro</option><option value="admin">Admin</option></select>}
            <button disabled={busy} aria-label={`Quitar a ${nameOf(member)}`} onClick={() => { if (window.confirm(`¿Quitar a ${nameOf(member)} del grupo?`)) void mutate(() => member.isGuest ? removeGuestMember(group.id,member.id) : deleteGroupMember(group.id,uid!), 'Miembro retirado.'); }} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 size={17}/></button></div>}
          {owner && <ShieldCheck size={20} className="text-red-700"/>}
        </article>;
      })}</section>
    </div>
  </GroupDialog>;
}
