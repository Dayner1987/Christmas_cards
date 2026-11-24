import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { Card } from '../../../types/cards.schema';
export function publicCardUrl(id: string) {
  return new URL(`/tarjetas/${encodeURIComponent(id)}`, window.location.origin).toString();
}
export async function copyLinkText(text: string) {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  const input = document.createElement('textarea');
  input.value = text; input.style.position = 'fixed'; input.style.opacity = '0';
  document.body.appendChild(input); input.select();
  try { if (!document.execCommand('copy')) throw new Error('No se pudo copiar.'); }
  finally { input.remove(); }
}
export default function CopyCardLink({ card, image = false }: { card: Card; image?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const imageUrl = card.frontImageUrl || card.previewImageUrl || card.backgroundImageUrl;
  const useImage = image && Boolean(imageUrl);
  return <div className="space-y-2">
    <button type="button" onClick={async () => {
      try { await copyLinkText(useImage ? imageUrl! : publicCardUrl(card.id)); setCopied(true); setError(''); }
      catch { setCopied(false); setError('No se pudo copiar. Comprueba el permiso del portapapeles de tu navegador.'); }
    }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 text-sm font-bold text-red-800 shadow-sm transition hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100">
      {copied ? <Check size={17}/> : <Copy size={17}/>}
      {copied ? 'Enlace copiado' : useImage ? 'Copiar enlace de la imagen' : 'Copiar enlace de la tarjeta'}
    </button>
    <span role="status" className="block text-xs text-slate-500">{error || (copied ? 'Listo para pegar donde quieras.' : '')}</span>
  </div>;
}
