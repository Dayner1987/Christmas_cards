import { useState } from 'react';
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  Smartphone,
} from 'lucide-react';
import type { Card } from '../../../types/cards.schema';

interface CardShareActionsProps {
  card: Card;
}

function getPublicCardUrl(cardId: string) {
  return new URL(
    `/tarjetas/${encodeURIComponent(cardId)}`,
    window.location.origin,
  ).toString();
}

export default function CardShareActions({ card }: CardShareActionsProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = getPublicCardUrl(card.id);
  const shareText = `¡Quiero compartir contigo esta tarjeta: ${card.name}! Ábrela aquí: ${shareUrl}`;

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('El navegador no permite copiar automáticamente.');
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setFeedback('Enlace copiado. Ya puedes pegarlo donde quieras.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setFeedback('No se pudo copiar el enlace. Selecciónalo y cópialo manualmente.');
    }
  };

  const shareOnWhatsApp = () => {
    const digits = phone.replace(/\D/g, '');

    if (phone.trim() && (digits.length < 8 || digits.length > 15)) {
      setFeedback('Escribe un número válido con código de país. Ejemplo: 591 71234567.');
      return;
    }

    const destination = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    setFeedback('Abriendo WhatsApp con el enlace de esta tarjeta…');
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  const shareByEmail = () => {
    const destination = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      setFeedback('Escribe una dirección de correo electrónico válida.');
      return;
    }

    const subject = `Te comparto una tarjeta: ${card.name}`;
    const body = `¡Hola!\n\nQuiero compartir contigo esta tarjeta.\n\n${shareUrl}\n\n¡Espero que te guste!`;
    const mailto = `mailto:${encodeURIComponent(destination)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setFeedback('Abriendo tu aplicación de correo…');
    window.location.href = mailto;
  };

  const shareFromDevice = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: card.name,
        text: `Mira esta tarjeta: ${card.name}`,
        url: shareUrl,
      });
      setFeedback('Enlace compartido correctamente.');
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setFeedback('No se pudo abrir el menú para compartir. Prueba copiando el enlace.');
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <div className="flex items-center gap-2 text-red-700">
          <Share2 size={19} />
          <h2 className="text-lg font-black text-red-950">Comparte esta tarjeta</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          La persona recibirá un enlace directo para abrir esta tarjeta, incluso si no tiene una cuenta.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="card-share-phone" className="text-sm font-bold text-slate-800">
          Número de WhatsApp
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Smartphone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="card-share-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') shareOnWhatsApp();
              }}
              placeholder="Ej. 591 71234567"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </div>
          <button
            type="button"
            onClick={shareOnWhatsApp}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#15803d] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#166534] active:scale-[.98]"
          >
            <MessageCircle size={18} />
            Enviar por WhatsApp
          </button>
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Incluye el código de país. Déjalo vacío para abrir WhatsApp y elegir el contacto allí.
        </p>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-2">
        <label htmlFor="card-share-email" className="text-sm font-bold text-slate-800">
          Correo electrónico
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="card-share-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') shareByEmail();
              }}
              placeholder="nombre@correo.com"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
            />
          </div>
          <button
            type="button"
            onClick={shareByEmail}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 active:scale-[.98]"
          >
            <Mail size={18} />
            Enviar por correo
          </button>
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Se abrirá tu aplicación de correo con el destinatario, el asunto y el enlace preparados.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-800 transition hover:bg-red-100"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
        <button
          type="button"
          onClick={() => void shareFromDevice()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Share2 size={17} />
          Compartir…
        </button>
      </div>

      {feedback && (
        <p role="status" aria-live="polite" className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-600">
          {feedback}
        </p>
      )}

      <div className="rounded-xl bg-red-50/70 p-3.5">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-red-700">
          Enlace público de esta tarjeta
        </p>
        <p className="break-all text-xs leading-5 text-red-950">{shareUrl}</p>
      </div>
    </section>
  );
}
