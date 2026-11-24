import {authStorage} from '../../config/auth.storage';
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
import CopyCardLink from '../../components/client/cards/CopyCardLink';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reducedMotion = useReducedMotion();
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
    <motion.section initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Link to={backPath} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-red-800 transition hover:bg-red-50"><ArrowLeft size={17}/>{backLabel}</Link>
        <span className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Un detalle para ti</span>
      </div>
      <article className="christmas-card-detail">
        <div className="christmas-card-visual">
          <motion.div initial={reducedMotion ? false : { scale: .96 }} animate={{ scale: 1 }} className="christmas-card-frame">
            {image ? <img src={image} alt={card.name}/> : <div className="christmas-card-placeholder"><Gift size={86} strokeWidth={1}/></div>}
          </motion.div>
        </div>
        <div className="christmas-card-description">
          <span className="card-category"><CalendarHeart size={16}/>{categoryLabels[card.category] || 'Tarjeta especial'}</span>
          <h1>{card.name}</h1>
          <p>{card.description || 'Los pequeños detalles hacen grandes momentos. Esta tarjeta es para ti.'}</p>
          <div className="card-detail-divider"><Sparkles size={20}/></div>
          <CopyCardLink key={card.id} card={card}/>
          <CopyCardLink key={`${card.id}:image`} card={card} image/>
        </div>
      </article>
      <section className="card-create-callout"><div><span><Sparkles size={20}/> UN DETALLE CON TU ESTILO</span><h2>Crea tu propia tarjeta navideña</h2><p>Elige una imagen, escribe tus mejores deseos y compártelos.</p></div><Link to={authStorage.getUser()?.role==='admin'?'/admin/cards':authStorage.getUser()?.role==='client'?'/home/cards?create=1#crear-tarjeta':'/login'}><Gift size={19}/> Crear mi propia tarjeta</Link></section>
    </motion.section>
  );
}
