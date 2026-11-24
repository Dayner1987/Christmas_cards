import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Gift, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getApiError } from '../api/http';
import { authStorage } from '../config/auth.storage';
export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [params] = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const token = params.get('token') || '';
  const validToken = /^[a-f0-9]{64}$/.test(token);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    if (reset && password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return; }
    setBusy(true); setMessage('');
    try {
      const result = await api.post(reset ? '/auth/reset-password' : '/auth/forgot-password', reset ? { token, password } : { email: email.trim() });
      if (reset) { authStorage.clearSession(); window.history.replaceState(null, '', '/reset-password'); }
      setMessage(result.data.message); setDone(true);
    } catch (e) { setMessage(getApiError(e)); } finally { setBusy(false); }
  }
  const invalid = reset && !validToken && !done;
  const field = 'mt-2 min-h-13 w-full rounded-2xl border border-red-100 bg-[#fffaf8] px-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50 disabled:opacity-60';
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fff8f4] px-4 py-8 sm:px-8">
    <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-100/60 blur-3xl"/>
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl"/>
    <motion.section initial={reducedMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(100,20,30,0.3)] lg:grid-cols-[.95fr_1.05fr]">
      <aside className="relative flex min-h-52 flex-col justify-between overflow-hidden bg-red-950 px-7 py-7 text-white sm:p-10 lg:min-h-[640px]">
        <img src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1000&q=85" alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover opacity-30"/>
        <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-red-950/60 to-red-900/25"/>
        <Link to="/" className="relative flex w-fit items-center gap-3 text-sm font-black"><span className="rounded-xl bg-white/15 p-2.5"><Gift size={22}/></span>ChristmasCards</Link>
        <div className="relative hidden py-10 lg:block" aria-hidden="true">
          <div className="mx-auto grid h-44 w-44 rotate-[-8deg] place-items-center rounded-[2rem] border border-white/25 bg-white/10 shadow-2xl backdrop-blur-md">
            <Mail size={80} strokeWidth={1} className="text-rose-100"/>
            <span className="absolute -bottom-4 -right-4 grid h-16 w-16 rotate-[8deg] place-items-center rounded-2xl bg-[#ffedcc] text-red-900 shadow-xl"><KeyRound size={30}/></span>
          </div>
          <Sparkles className="absolute right-8 top-10 text-amber-200" size={28}/>
        </div>
        <div className="relative mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-rose-200">Vuelve a los buenos momentos</p>
          <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight sm:text-4xl">La magia sigue<br/>esperándote aquí.</h2>
          <p className="mt-4 hidden max-w-xs text-sm leading-6 text-rose-100/80 sm:block">Tus tarjetas, tus amigos y esos detalles que hacen sonreír. Recupera tu acceso y sigue compartiendo.</p>
        </div>
      </aside>
      <div className="flex flex-col justify-center px-6 py-9 sm:px-12 sm:py-12">
        <Link to="/login" className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-red-700"><ArrowLeft size={16}/> Volver a iniciar sesión</Link>
        <motion.div key={done ? 'success' : invalid ? 'invalid' : 'form'} initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
          <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {done ? <Check size={28}/> : reset ? <LockKeyhole size={26}/> : <KeyRound size={26}/>}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-red-500">{done ? 'Un paso más cerca' : 'Estamos para ayudarte'}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-red-950">{done ? reset ? '¡Todo listo!' : 'Revisa tu correo' : invalid ? 'Este enlace no es válido' : reset ? 'Nueva contraseña' : 'Recuperar contraseña'}</h1>
          {!done && !invalid && <p className="mb-7 mt-3 text-sm leading-6 text-slate-500">{reset ? 'Elige una contraseña nueva para volver a disfrutar de tu espacio.' : 'A veces pasa. Escribe el correo de tu cuenta y te ayudamos a volver.'}</p>}
          {message && <p role="status" aria-live="polite" className={`my-5 rounded-2xl border p-4 text-sm leading-6 ${done ? 'border-emerald-100 bg-emerald-50 text-emerald-900' : 'border-red-100 bg-red-50 text-red-800'}`}>{message}</p>}
          {invalid ? <div className="mt-4 space-y-6"><p className="text-sm leading-6 text-slate-500">Solicita un nuevo enlace para restablecer tu contraseña.</p><Link to="/forgot-password" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-red-700 px-5 text-sm font-bold text-white">Solicitar otro enlace <ArrowRight size={17}/></Link></div>
          : done ? <div className="space-y-6">
            {!reset && <p className="text-sm leading-6 text-slate-500">Si no lo encuentras, revisa también la carpeta de spam. El enlace estará disponible durante 30 minutos.</p>}
            <Link to="/login" className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 text-sm font-bold text-white shadow-lg shadow-red-700/15 transition hover:bg-red-800">{reset ? 'Iniciar sesión' : 'Volver al inicio de sesión'}<ArrowRight size={18}/></Link>
          </div> : <form onSubmit={submit} className="space-y-5">
            {reset ? <>
              <label className="block text-sm font-bold text-slate-700">Nueva contraseña<input className={field} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" disabled={busy} required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)}/></label>
              <label className="block text-sm font-bold text-slate-700">Repite la contraseña<input className={field} type="password" autoComplete="new-password" placeholder="Confirma tu nueva contraseña" disabled={busy} required value={confirmation} onChange={e => setConfirmation(e.target.value)}/></label>
            </> : <label className="block text-sm font-bold text-slate-700">Correo de tu cuenta<input className={field} type="email" autoComplete="email" placeholder="nombre@correo.com" disabled={busy} required maxLength={150} value={email} onChange={e => setEmail(e.target.value)}/></label>}
            <motion.button whileTap={reducedMotion ? undefined : { scale: .98 }} disabled={busy} className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 text-sm font-bold text-white shadow-lg shadow-red-700/15 transition hover:bg-red-800 disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin"/> : <ArrowRight size={18}/>}{busy ? 'Procesando…' : reset ? 'Cambiar contraseña' : 'Enviar enlace'}
            </motion.button>
          </form>}
          <p className="mt-8 flex items-center justify-center gap-2 border-t border-red-50 pt-6 text-xs text-slate-400"><ShieldCheck size={16}/>Tu acceso, siempre protegido.</p>
        </motion.div>
      </div>
    </motion.section>
  </main>;
}
