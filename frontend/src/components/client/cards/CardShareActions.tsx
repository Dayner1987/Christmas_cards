import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import { api, getApiError } from '../../../api/http';
import { authStorage } from '../../../config/auth.storage';
import type { Card } from '../../../types/cards.schema';
import CopyCardLink, { publicCardUrl } from './CopyCardLink';
export default function CardShareActions({ card, onBusyChange }: { card: Card; onBusyChange?(value: boolean): void }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const authenticated = authStorage.isAuthenticated();
  const enabled = card.isActive && card.isPublic;
  const input = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50';
  return <div className="space-y-5">
    <form onSubmit={e => {
      e.preventDefault(); if (!enabled) return;
      const digits = phone.replace(/\D/g, '');
      if (phone.trim() && (digits.length < 8 || digits.length > 15)) { setFeedback('Escribe un número válido con código de país.'); return; }
      const text = `¡Quiero compartir contigo esta tarjeta: ${card.name}! ${publicCardUrl(card.id)}`;
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      setFeedback('WhatsApp se abrirá con tu tarjeta lista para compartir.');
    }} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-bold text-emerald-900"><MessageCircle size={20}/> Por WhatsApp</h3>
      <label className="mt-4 block text-xs font-semibold text-slate-600">Número de WhatsApp
        <input type="tel" autoComplete="tel" placeholder="Ej. 591 71234567 (opcional)" value={phone} onChange={e => setPhone(e.target.value)} className={input}/>
      </label>
      <p className="mt-2 text-xs text-slate-500">Déjalo vacío para elegir el contacto en WhatsApp.</p>
      <button disabled={!enabled} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"><MessageCircle size={17}/> Enviar por WhatsApp</button>
    </form>
    <form onSubmit={async e => {
      e.preventDefault(); if (busy || !enabled || !authenticated) return;
      setBusy(true); onBusyChange?.(true); setFeedback('');
      try { const response = await api.post(`/cards/${card.id}/email`, { email: email.trim() }); setFeedback(response.data.message); setEmail(''); }
      catch (error) { setFeedback(getApiError(error)); }
      finally { setBusy(false); onBusyChange?.(false); }
    }} className="rounded-2xl border border-red-100 bg-red-50/40 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-bold text-red-950"><Mail size={20}/> Por correo electrónico</h3>
      {authenticated ? <>
        <label className="mt-4 block text-xs font-semibold text-slate-600">Correo del destinatario
          <input type="email" autoComplete="email" required maxLength={150} placeholder="nombre@correo.com" value={email} onChange={e => setEmail(e.target.value)} className={input}/>
        </label>
        <button disabled={busy || !enabled} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {busy ? 'Enviando…' : 'Enviar por correo'}</button>
      </> : <p className="mt-3 text-sm text-slate-600"><Link to="/login" className="font-bold text-red-700 underline">Inicia sesión</Link> para enviar por correo.</p>}
    </form>
    {!enabled && <p className="text-sm text-red-700">La tarjeta debe estar pública y activa para compartirla.</p>}
    {feedback && <p role="status" aria-live="polite" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{feedback}</p>}
    {enabled && <div className="border-t border-red-100 pt-4"><CopyCardLink card={card}/></div>}
  </div>;
}
