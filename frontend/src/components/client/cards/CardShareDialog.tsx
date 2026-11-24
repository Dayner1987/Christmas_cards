import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import type { Card } from '../../../types/cards.schema';
import CardShareActions from './CardShareActions';
export default function CardShareDialog({ card, onClose }: { card: Card; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const image = card.frontImageUrl || card.previewImageUrl || card.backgroundImageUrl;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy}
    onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}
    onClick={e => { if (e.target === e.currentTarget && !busy) { const r=e.currentTarget.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) onClose(); } }}
    className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[1.75rem] border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-red-950/50 backdrop:backdrop-blur-sm">
    <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-red-100 bg-white/95 p-5 backdrop-blur">
        <div><h2 id={titleId} className="text-xl font-black text-red-950">Comparte un momento bonito</h2><p className="mt-1 text-xs text-slate-500">Elige cómo hacer llegar tu tarjeta.</p></div>
        <button autoFocus type="button" disabled={busy} onClick={onClose} aria-label="Cerrar compartir" className="rounded-full bg-red-50 p-2 text-red-800 hover:bg-red-100 disabled:opacity-40"><X size={20}/></button>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-4 rounded-2xl border border-red-100 p-3">
          {image ? <img src={image} alt="" className="h-16 w-16 rounded-xl bg-red-50 object-contain"/> : <Gift className="h-12 w-12 text-red-300"/>}
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Tu tarjeta</p><p className="mt-1 break-words font-bold text-red-950">{card.name}</p></div>
        </div>
        <CardShareActions card={card} onBusyChange={setBusy}/>
        <p className="text-center text-xs text-slate-400">Quien reciba el enlace podrá verla sin tener una cuenta.</p>
      </div>
    </motion.div>
  </dialog>;
}
