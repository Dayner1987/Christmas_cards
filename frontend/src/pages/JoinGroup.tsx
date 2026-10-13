// src/pages/JoinGroup.tsx
import { useEffect, useState } from 'react';
import { ArrowRight, Gift, KeyRound, Link2, ShieldCheck, Users, UserRoundPlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGroupByInvitationCode, joinGuestGroup, joinRegisteredGroup } from '../api/groups';
import { getApiError } from '../api/http';
import { authStorage } from '../config/auth.storage';
import { guestStorage } from '../config/guest.storage';
import type { Group } from '../types/group.schema';

export default function JoinGroup() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getGroupByInvitationCode(code).then(data => {
      if (mounted) setGroup(data);
    }).catch(cause => { if (mounted) setError(getApiError(cause)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [code]);

  const enterAsGuest = async () => {
    if (!group || name.trim().length < 2 || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await joinGuestGroup(code, name.trim());
      guestStorage.save(result.groupId, result.guestToken);
      navigate(`/guests/participation/${result.groupId}`, { replace: true });
    } catch (cause) { setError(getApiError(cause)); }
    finally { setBusy(false); }
  };

  const enterWithAccount = async () => {
    if (!group || busy) return;
    if (!authStorage.isAuthenticated()) {
      setNotice('Inicia sesión y vuelve a abrir este enlace para entrar con tu cuenta.');
      return;
    }
    setBusy(true); setError('');
    try {
      await joinRegisteredGroup(code);
      navigate(authStorage.getUser()?.role === 'admin' ? '/admin/groups' : '/home');
    } catch (cause) { setError(getApiError(cause)); }
    finally { setBusy(false); }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f5] px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-red-100 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-amber-100 blur-3xl" />
      <div className="relative mx-auto max-w-xl">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-black text-red-800"><Gift size={19}/> Christmas Cards</Link>
        <section className="overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl shadow-red-900/10">
          <div className="bg-gradient-to-br from-red-900 via-red-700 to-rose-600 p-8 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"><Link2 size={14}/> Invitación especial</span>
            <h1 className="mt-6 text-3xl font-black tracking-tight">Tu próximo recuerdo comienza aquí</h1>
            <p className="mt-2 text-sm text-red-100">Reúnete con tus amigos, comparte deseos y participa en el Amigo Secreto.</p>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            {loading && <p className="text-sm text-slate-500">Verificando invitación...</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {notice && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
            {group && (
              <>
                <div className="flex items-center gap-4 rounded-2xl bg-red-50 p-4">
                  {group.imageUrl ? <img className="h-16 w-16 rounded-2xl object-cover" alt={group.name} src={group.imageUrl} /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-700 text-white"><Users size={27}/></div>}
                  <div><h2 className="text-xl font-black text-red-950">{group.name}</h2><p className="mt-1 text-sm text-slate-600">{group.description || 'Un grupo para celebrar juntos'}</p></div>
                </div>
                {group.joinMode === 'closed' ? (
                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Este grupo solo admite miembros añadidos por su organizador.</p>
                ) : (
                  <>
                    <div>
                      <label htmlFor="guest-name" className="mb-2 block text-sm font-bold">¿Cómo quieres que te llamemos?</label>
                      <input id="guest-name" value={name} maxLength={80} onChange={event => setName(event.target.value)}
                        placeholder="Ej. Carlos, Ana, María..." className="min-h-12 w-full rounded-xl border border-red-200 px-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100" />
                      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/> Puedes participar sin crear una cuenta.</p>
                    </div>
                    <button disabled={busy || name.trim().length < 2} onClick={() => void enterAsGuest()}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 font-bold text-white transition hover:bg-red-800 disabled:opacity-50">
                      <UserRoundPlus size={18}/> Entrar como invitado <ArrowRight size={18}/>
                    </button>
                    <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/> o con una cuenta <span className="h-px flex-1 bg-slate-200"/></div>
                    <button disabled={busy} onClick={() => void enterWithAccount()}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 font-bold text-red-800 hover:bg-red-50 disabled:opacity-50">
                      <KeyRound size={18}/> Unirme con mi cuenta
                    </button>
                    {!authStorage.isAuthenticated() && <p className="text-center text-sm text-slate-500"><Link className="font-bold text-red-700 underline" to="/login">Inicia sesión</Link> o <Link className="font-bold text-red-700 underline" to="/register">regístrate</Link> para participar con cuenta.</p>}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
