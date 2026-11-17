import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarHeart,
  Gift,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getPublicCardById } from '../../api/cards';
import { getApiError } from '../../api/http';
import type { Card, CardCategory } from '../../types/cards.schema';
import CardShareActions from '../../components/client/cards/CardShareActions';

interface CardDetailPageProps {
  publicView?: boolean;
}

const categoryLabels: Record<CardCategory, string> = {
  christmas: 'Navidad',
  new_year: 'Año Nuevo',
  secret_santa: 'Amigo secreto',
  custom: 'Personalizada',
};

export default function CardDetailPage({ publicView = false }: CardDetailPageProps) {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!cardId) {
      setError('No se indicó qué tarjeta deseas abrir.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setCard(null);

    getPublicCardById(cardId)
      .then((result) => {
        if (active) setCard(result);
      })
      .catch((cause) => {
        if (active) setError(getApiError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cardId]);

  useEffect(() => {
    if (!card) return;

    const previousTitle = document.title;
    document.title = `${card.name} | ChristmasCards`;

    return () => {
      document.title = previousTitle;
    };
  }, [card]);

  const backPath = publicView ? '/' : '/home/cards';
  const backLabel = publicView ? 'Ir al inicio' : 'Volver al catálogo';

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-red-600" size={42} />
          <p className="mt-4 text-sm font-semibold text-slate-500">Preparando tu tarjeta…</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <section className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-100 text-red-700">
          <Gift size={30} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-red-950">No encontramos esta tarjeta</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          {error || 'Es posible que haya sido eliminada o que ya no esté disponible públicamente.'}
        </p>
        <Link to={backPath} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800">
          <ArrowLeft size={17} />
          {backLabel}
        </Link>
      </section>
    );
  }

  const image = card.frontImageUrl || card.previewImageUrl || card.backgroundImageUrl;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backPath}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-red-800 transition hover:bg-red-50"
        >
          <ArrowLeft size={18} />
          {backLabel}
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-red-700">
          <Sparkles size={15} />
          Vista completa
        </span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-gradient-to-br from-red-950 via-rose-950 to-slate-950 shadow-xl shadow-red-950/10">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden p-4 sm:min-h-[620px] sm:p-8">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

            <div className="relative flex min-h-[390px] w-full max-w-2xl items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/5 p-3 shadow-2xl shadow-black/30 backdrop-blur-sm sm:min-h-[560px] sm:p-5">
              {image ? (
                <img
                  src={image}
                  alt={card.name}
                  className="max-h-[78vh] w-full rounded-xl object-contain"
                />
              ) : (
                <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-red-700 via-rose-600 to-amber-500 p-8 text-center text-white sm:min-h-[500px]">
                  <Gift size={76} strokeWidth={1.2} />
                  <p className="mt-7 max-w-md text-3xl font-black leading-tight">{card.name}</p>
                  {card.description && <p className="mt-4 max-w-md text-sm leading-6 text-white/85">{card.description}</p>}
                  <Sparkles className="mt-8 text-amber-100" size={28} />
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col justify-center bg-[#fffaf8] p-5 sm:p-8 lg:p-10">
            <div className="mb-5 flex items-center gap-2 text-red-700">
              <CalendarHeart size={18} />
              <span className="text-xs font-black uppercase tracking-[.18em]">
                {categoryLabels[card.category] || 'Tarjeta especial'}
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-red-950 sm:text-4xl">
              {card.name}
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              {card.description || 'Una tarjeta especial para compartir cariño, buenos deseos y momentos inolvidables.'}
            </p>

            <div className="my-7 h-px bg-gradient-to-r from-red-200 via-rose-100 to-transparent" />

            <CardShareActions card={card} />

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              Hecha para compartir buenos momentos. El enlace abre directamente esta tarjeta.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
