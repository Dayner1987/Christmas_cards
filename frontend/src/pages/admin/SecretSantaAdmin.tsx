import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays, ImagePlus, Copy,
  Check,
  Gift,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';

import SecretSantaEventForm from '../../components/admin/secretSanta/SecretSantaEventForm';
import SecretSantaRoulette from '../../components/admin/secretSanta/SecretSantaRoulette';
import type { DrawResult } from '../../components/admin/secretSanta/SecretSantaRoulette';

import {
  ErrorNotice,
  formatPrice,
  getErrorMessage,
  WishlistModal as Modal,
} from '../../components/admin/wishlists/WishlistUI';

import { useSecretSantaEvents } from '../../hooks/secret_santa_events';
import { uploadEventImage } from '../../api/secret_santa_events';
import { useSecretSantaAssignments } from '../../hooks/secret_santa_assignments.hook';

import type {
  CreateSecretSantaEvent,
  SecretSantaEvent,
  SecretSantaEventStatus,
} from '../../types/secret_santa_events.schema';

type Confirmation = {
  event: SecretSantaEvent;
  action: 'cancel' | 'complete';
};

const statusLabels: Record<SecretSantaEventStatus, string> = {
  draft: 'Por sortear',
  drawn: 'Sorteado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

function dateLabel(value: string | null): string {
  if (!value) return 'Por definir';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Fecha no válida';

  return date.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deliveryLabel(value: string | null, now: number): string {
  if (!value) return 'Entrega por definir';

  const target = new Date(value).getTime();

  if (!Number.isFinite(target)) return 'Revisar fecha de entrega';

  const difference = target - now;

  if (difference <= 0) return 'Fecha de entrega alcanzada';

  const days = Math.ceil(difference / 86_400_000);

  return days === 1
    ? 'La entrega es en menos de 24 horas'
    : `Faltan ${days} días para la entrega`;
}

export default function SecretSantaAdmin() {
  const {
    events,
    fetchMyEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    cancelEvent,
    completeEvent,
  } = useSecretSantaEvents();

  const { drawAssignments } = useSecretSantaAssignments();

  const initialLoad = useRef(fetchMyEvents);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | SecretSantaEventStatus>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SecretSantaEvent | null>(null);
  const [rouletteEvent, setRouletteEvent] =
    useState<SecretSantaEvent | null>(null);
  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    void initialLoad.current()
      .catch((caught: unknown) => {
        if (active) setError(getErrorMessage(caught));
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredEvents = [...events]
    .filter((event) => {
      const query = search.trim().toLocaleLowerCase('es');
      const text =
        `${event.name} ${event.description ?? ''}`.toLocaleLowerCase('es');

      return (
        text.includes(query) &&
        (status === 'all' || event.status === status)
      );
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );

  const upcomingEvent = events
    .filter(
      (event) =>
        (event.status === 'draft' || event.status === 'drawn') &&
        event.giftDeliveryDate &&
        new Date(event.giftDeliveryDate).getTime() > now,
    )
    .sort(
      (first, second) =>
        new Date(first.giftDeliveryDate!).getTime() -
        new Date(second.giftDeliveryDate!).getTime(),
    )[0];

  const stats = [
    { label: 'Eventos', value: events.length, icon: CalendarDays },
    {
      label: 'Por sortear',
      value: events.filter((event) => event.status === 'draft').length,
      icon: Sparkles,
    },
    {
      label: 'Sorteados',
      value: events.filter((event) => event.status === 'drawn').length,
      icon: Gift,
    },
    {
      label: 'Finalizados',
      value: events.filter((event) => event.status === 'completed').length,
      icon: Trophy,
    },
  ];

  const uploadCover = async (eventId: string, file?: File) => {
    if (!file || busy) return;
    setBusy(true); setError('');
    try {
      await uploadEventImage(eventId, file);
      await refreshAfterMutation();
      setNotice('Portada guardada en Cloudinary.');
    } catch (caught) { setError(getErrorMessage(caught)); }
    finally { setBusy(false); }
  };

  const refresh = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await fetchMyEvents();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  // Un fallo al refrescar no convierte una operación guardada en fallida.
  const refreshAfterMutation = async () => {
    try {
      await fetchMyEvents();
    } catch (caught) {
      setError(
        `La operación se confirmó, pero no se pudo actualizar el listado: ${getErrorMessage(caught)}`,
      );
    }
  };

  const saveEvent = async (data: CreateSecretSantaEvent) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (editing) {
        await updateEvent(editing.id, {
          name: data.name,
          description: data.description,
          currencyCode: data.currencyCode,
          ...(data.budget !== undefined ? { budget: data.budget } : {}),
          ...(data.drawDate ? { drawDate: data.drawDate } : {}),
          ...(data.giftDeliveryDate
            ? { giftDeliveryDate: data.giftDeliveryDate }
            : {}),
        });
      } else {
        await createEvent(data);
      }

      setFormOpen(false);
      setEditing(null);
      setStatus('all');
      setSearch('');
      setNotice(editing ? 'Evento actualizado.' : 'Evento creado. ¡Prepara el sorteo!');
    } finally {
      // El formulario captura los errores de guardado.
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!confirmation || busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (confirmation.action === 'cancel') {
        await cancelEvent(confirmation.event.id);
        setNotice('Evento cancelado.');
      } else {
        await completeEvent(confirmation.event.id);
        setNotice('Evento finalizado.');
      }

      setConfirmation(null);
      await refreshAfterMutation();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const executeDraw = async (): Promise<DrawResult> => {
    if (!rouletteEvent || busy) {
      throw new Error('No se puede iniciar el sorteo en este momento.');
    }

    const eventId = rouletteEvent.id;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      // Consulta el estado real antes de solicitar una nueva asignación.
      const current = await fetchEventById(eventId);

      if (!current) {
        throw new Error('No se pudo verificar el estado del evento.');
      }

      if (current.status === 'drawn' || current.status === 'completed') {
        await refreshAfterMutation();

        return {
          message:
            'Este evento ya tenía un sorteo registrado. Se conservaron sus asignaciones.',
        };
      }

      if (current.status !== 'draft') {
        throw new Error('El evento no está disponible para realizar el sorteo.');
      }

      let count: number | undefined;

      try {
        const draw = await drawAssignments(eventId);
        if (draw.status !== 'drawn') throw new Error('El servidor no confirmó el sorteo.');
        count = draw.participants;
      } catch (drawError) {
        // La respuesta puede perderse después de que el servidor guarde.
        // Comprobamos el estado; nunca repetimos el POST automáticamente.
        let confirmed = false;

        try {
          const latest = await fetchEventById(eventId);
          confirmed =
            latest?.status === 'drawn' ||
            latest?.status === 'completed';
        } catch {
          confirmed = false;
        }

        if (!confirmed) {
          throw new Error(
            `No se pudo confirmar el sorteo: ${getErrorMessage(drawError)}. Actualiza el evento antes de volver a intentarlo.`,
          );
        }
      }

      await refreshAfterMutation();
      setNotice('Sorteo confirmado. Las asignaciones quedaron registradas.');

      return {
        count,
        message:
          'El servidor confirmó el sorteo. Las parejas permanecen ocultas en esta vista.',
      };
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 p-6 text-white sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border-[30px] border-white/10"
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Que el regalo sea una sorpresa
                </span>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Amigo secreto
                </h1>

                <p className="mt-3 text-sm leading-6 text-red-100">
                  Crea el evento, reúne a tu grupo y deja que la ruleta
                  dé inicio al intercambio.
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setError('');
                  setFormOpen(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-lg transition hover:bg-red-50 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Crear evento
              </button>
            </div>
          </header>

          {error && !confirmation && <ErrorNotice message={error} />}

          {notice && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <Check className="h-5 w-5 shrink-0" />
              {notice}
            </p>
          )}

          <section
            aria-label="Resumen de eventos"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="rounded-2xl border border-red-100 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-500">{label}</span>
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {value}
                </p>
              </article>
            ))}
          </section>

          {upcomingEvent && (
            <div className="flex items-start gap-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
              <span className="rounded-xl bg-white p-3 text-rose-600">
                <Gift className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Próximo intercambio
                </p>
                <p className="mt-1 break-words font-bold text-slate-900">
                  {upcomingEvent.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {deliveryLabel(upcomingEvent.giftDeliveryDate, now)}
                </p>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Buscar eventos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar un evento..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </div>

            <select
              aria-label="Filtrar eventos por estado"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'all' | SecretSantaEventStatus)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-red-100"
            >
              <option value="all">Todos los eventos</option>
              <option value="draft">Por sortear</option>
              <option value="drawn">Sorteados</option>
              <option value="completed">Finalizados</option>
              <option value="cancelled">Cancelados</option>
            </select>

            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              aria-label="Actualizar eventos"
              className="flex items-center justify-center rounded-xl border border-red-200 p-3 text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <RefreshCw className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
            </button>
          </section>

          {busy && (
            <p role="status" className="flex items-center gap-2 text-sm text-red-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando...
            </p>
          )}

          {!busy && filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-red-200 bg-red-50/40 p-10 text-center">
              <Gift className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No hay eventos para mostrar
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {search || status !== 'all'
                  ? 'Cambia los filtros para encontrar otros eventos.'
                  : 'Crea tu primer evento y prepara una sorpresa para el grupo.'}
              </p>
            </div>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition hover:border-red-300 hover:shadow-lg hover:shadow-red-100/50"
                >
                  {event.imageUrl && <img alt={`Portada de ${event.name}`} src={event.imageUrl} className="h-36 w-full object-cover" />}
                  <div className="flex items-center justify-between gap-3 bg-red-50/70 p-5">
                    <span className="rounded-2xl bg-white p-3 text-red-600 shadow-sm">
                      {event.status === 'completed' ? (
                        <Trophy className="h-6 w-6" />
                      ) : (
                        <Gift className="h-6 w-6" />
                      )}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        event.status === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : event.status === 'drawn'
                            ? 'bg-red-100 text-red-700'
                            : event.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {statusLabels[event.status]}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="break-words text-xl font-bold text-slate-900">
                      {event.name}
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                      {event.description || 'Un intercambio para compartir y sorprender.'}
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Presupuesto por regalo
                      </p>
                      <p className="mt-1 text-xl font-bold text-red-700">
                        {event.budget === null
                          ? 'Por definir'
                          : formatPrice(String(event.budget), event.currencyCode)}
                      </p>
                    </div>

                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-slate-400">Sorteo previsto</dt>
                        <dd className="mt-1 font-medium text-slate-700">
                          {dateLabel(event.drawDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">Entrega de regalos</dt>
                        <dd className="mt-1 font-medium text-slate-700">
                          {dateLabel(event.giftDeliveryDate)}
                        </dd>
                      </div>
                    </dl>

                    {(event.status === 'draft' || event.status === 'drawn') && (
                      <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {deliveryLabel(event.giftDeliveryDate, now)}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700">
                        <ImagePlus size={15}/> Subir portada
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy}
                          onChange={input => { void uploadCover(event.id, input.target.files?.[0]); input.currentTarget.value=''; }}/>
                      </label>
                      <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700"
                        onClick={() => void navigator.clipboard.writeText(event.id).then(() => setNotice('ID de evento copiado para invitados.')).catch(() => setError('No se pudo copiar el ID.'))}>
                        <Copy size={15}/> Copiar ID del evento
                      </button>
                    </div>
                    <div className="mt-auto space-y-3 pt-5">
                      {event.status === 'draft' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setError('');
                            setRouletteEvent(event);
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-bold text-white hover:from-red-700 hover:to-rose-700 disabled:opacity-40"
                        >
                          <Sparkles className="h-4 w-4" />
                          Abrir ruleta
                        </button>
                      )}

                      {event.status === 'drawn' && (
                        <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">
                          🎁 Sorteo realizado
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {event.status === 'draft' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditing(event);
                              setError('');
                              setFormOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                        )}

                        {event.status === 'drawn' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setError('');
                              setConfirmation({ event, action: 'complete' });
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                          >
                            <Trophy className="h-4 w-4" />
                            Finalizar
                          </button>
                        )}

                        {(event.status === 'draft' || event.status === 'drawn') && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setError('');
                              setConfirmation({ event, action: 'cancel' });
                            }}
                            className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>

      {formOpen && (
        <SecretSantaEventForm
          event={editing}
          busy={busy}
          onSave={saveEvent}
          onClose={() => {
            if (!busy) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
        />
      )}

      {rouletteEvent && (
        <SecretSantaRoulette
          key={rouletteEvent.id}
          eventName={rouletteEvent.name}
          onDraw={executeDraw}
          onClose={() => {
            if (!busy) setRouletteEvent(null);
          }}
        />
      )}

      {confirmation && (
        <Modal
          title={
            confirmation.action === 'cancel'
              ? 'Cancelar evento'
              : 'Finalizar evento'
          }
          busy={busy}
          onClose={() => {
            if (!busy) {
              setConfirmation(null);
              setError('');
            }
          }}
        >
          <div className="space-y-5">
            {error && <ErrorNotice message={error} />}

            <p className="break-words text-sm leading-6 text-slate-600">
              {confirmation.action === 'cancel'
                ? '¿Quieres cancelar este evento?'
                : '¿Quieres dar por finalizado este intercambio?'}
              {' '}
              <strong className="text-slate-900">
                {confirmation.event.name}
              </strong>
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={() => {
                  setConfirmation(null);
                  setError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmAction()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
