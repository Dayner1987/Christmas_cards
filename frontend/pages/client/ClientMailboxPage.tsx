
 // src/pages/client/ClientMailboxPage.tsx

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  Gift,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  getReceivedUserCards,
  getSentUserCards,
  markUserCardAsRead,
} from '../../api/user_cards';

import { getApiError } from '../../api/http';
import type { UserCard } from '../../types/user_cards.schema';

type MailboxTab = 'received' | 'sent';

function getCardImage(message: UserCard) {
  return (
    message.card?.frontImageUrl ||
    message.card?.previewImageUrl ||
    message.card?.backgroundImageUrl ||
    null
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ClientMailboxPage() {
  const [tab, setTab] = useState<MailboxTab>('received');

  const [received, setReceived] = useState<UserCard[]>([]);
  const [sent, setSent] = useState<UserCard[]>([]);

  const [selected, setSelected] = useState<UserCard | null>(null);

  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);

  const [error, setError] = useState('');

  const loadMailbox = async () => {
    setLoading(true);
    setError('');

    try {
      const [receivedCards, sentCards] = await Promise.all([
        getReceivedUserCards(),
        getSentUserCards(),
      ]);

      setReceived(receivedCards);

      setSent(
        sentCards.filter((card) =>
          ['sent', 'delivered', 'read'].includes(
            card.deliveryStatus,
          ),
        ),
      );
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      getReceivedUserCards(),
      getSentUserCards(),
    ])
      .then(([receivedCards, sentCards]) => {
        if (!active) return;

        setReceived(receivedCards);
        setSent(
          sentCards.filter((card) =>
            ['sent', 'delivered', 'read'].includes(
              card.deliveryStatus,
            ),
          ),
        );
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
  }, []);

  const openCard = async (message: UserCard) => {
    setSelected(message);

    if (
      tab !== 'received' ||
      message.deliveryStatus === 'read' ||
      reading
    ) {
      return;
    }

    setReading(true);
    setError('');

    try {
      const updated = await markUserCardAsRead(message.id);

      const merged: UserCard = {
        ...message,
        ...updated,
        card: message.card,
      };

      setReceived((current) =>
        current.map((item) =>
          item.id === message.id ? merged : item,
        ),
      );

      setSelected(merged);
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setReading(false);
    }
  };

  const messages = tab === 'received' ? received : sent;

  const changeTab = (value: MailboxTab) => {
    setTab(value);
    setSelected(null);
    setError('');
  };

  return (
    <div className="space-y-8">

      {/* ENCABEZADO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-red-800 to-rose-600 p-8 text-white sm:p-12">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[40px] border-white/10" />

        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider">
          <Mail size={17} />
          Mensajes especiales
        </span>

        <h1 className="relative mt-5 text-4xl font-black sm:text-5xl">
          Mi buzón navideño
        </h1>

        <p className="relative mt-4 max-w-2xl text-red-100">
          Descubre las tarjetas que tus amigos te enviaron
          y vuelve a leer sus mejores deseos.
        </p>
      </section>

      {/* NAVEGACIÓN */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex gap-2 rounded-2xl bg-red-50 p-1.5">
          <button
            type="button"
            onClick={() => changeTab('received')}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              tab === 'received'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-red-700 hover:bg-white'
            }`}
          >
            <Inbox size={18} />
            Recibidas
          </button>

          <button
            type="button"
            onClick={() => changeTab('sent')}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              tab === 'sent'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-red-700 hover:bg-white'
            }`}
          >
            <Send size={18} />
            Enviadas
          </button>
        </div>

        <button
          type="button"
          onClick={() => void loadMailbox()}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Actualizar
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {/* MENSAJES */}
      {loading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
          Cargando tus tarjetas...
        </div>
      ) : messages.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-red-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-red-50 text-red-600">
            <Gift size={39} />
          </div>

          <h2 className="mt-5 text-2xl font-black text-red-950">
            {tab === 'received'
              ? 'Tu buzón está esperando una sorpresa'
              : 'Todavía no enviaste tarjetas'}
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
            {tab === 'received'
              ? 'Cuando un amigo te envíe una tarjeta, aparecerá aquí.'
              : 'Elige una tarjeta navideña y compártela con tus amigos.'}
          </p>

          <Link
            to="/home/cards"
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-6 py-3 font-bold text-white transition hover:bg-red-800"
          >
            <Gift size={18} />
            Explorar tarjetas
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {messages.map((message) => {
            const image = getCardImage(message);

            const unread =
              tab === 'received' &&
              message.deliveryStatus !== 'read';

            const person =
              tab === 'received'
                ? message.senderName || 'Un amigo'
                : message.recipientName || 'Un amigo';

            return (
              <button
                key={message.id}
                type="button"
                onClick={() => void openCard(message)}
                className={`group w-full cursor-pointer overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  unread
                    ? 'border-red-300'
                    : 'border-red-100'
                }`}
              >
                <div className="flex min-h-40 items-stretch">
                  <div className="flex w-32 shrink-0 items-center justify-center bg-gradient-to-br from-red-900 to-rose-500 text-white sm:w-40">
                    {image ? (
                      <img
                        src={image}
                        alt={message.card?.name || 'Tarjeta navideña'}
                        loading="lazy"
                        className="h-full min-h-40 w-full object-cover"
                      />
                    ) : (
                      <Gift size={48} strokeWidth={1.4} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {unread ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          Nueva
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          {tab === 'received'
                            ? <MailOpen size={14} />
                            : <CheckCheck size={14} />}
                          {tab === 'received' ? 'Leída' : 'Enviada'}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-lg font-black text-red-950">
                      {message.title ||
                        message.card?.name ||
                        'Tarjeta especial'}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-red-700">
                      {tab === 'received' ? 'De: ' : 'Para: '}
                      {person}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {message.message}
                    </p>

                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400">
                      <CalendarDays size={14} />
                      {formatDate(
                        message.sentAt || message.createdAt,
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* VISUALIZAR TARJETA */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ver tarjeta navideña"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/70 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Cerrar tarjeta"
              className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white p-2 text-red-700 shadow-md transition hover:bg-red-50"
            >
              <X size={20} />
            </button>

            <div className="flex h-60 items-center justify-center bg-gradient-to-br from-red-900 to-rose-500 text-white">
              {getCardImage(selected) ? (
                <img
                  src={getCardImage(selected)!}
                  alt={selected.card?.name || 'Tarjeta'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Gift size={84} strokeWidth={1.3} />
              )}
            </div>

            <div className="p-7 text-center sm:p-9">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Un mensaje especial
              </p>

              <h2 className="mt-3 text-2xl font-black text-red-950">
                {selected.title ||
                  selected.card?.name ||
                  'Feliz Navidad'}
              </h2>

              <p className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-red-50 p-6 text-base leading-8 text-red-950">
                {selected.message}
              </p>

              <p className="mt-6 text-sm font-semibold text-red-700">
                {tab === 'received'
                  ? `Con cariño, ${selected.senderName || 'un amigo'}`
                  : `Enviada a ${selected.recipientName || 'un amigo'}`}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-bold text-red-700 transition hover:bg-red-50"
                >
                  <ArrowLeft size={17} />
                  Volver al buzón
                </button>

                <Link
                  to="/home/cards"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
                >
                  <Send size={17} />
                  Enviar otra tarjeta
                </Link>
              </div>

              {reading && (
                <p className="mt-4 text-xs text-slate-500">
                  Actualizando estado de lectura...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
