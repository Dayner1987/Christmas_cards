
 // src/components/client/ClientEvents.tsx

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Link } from 'react-router-dom';

import {
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Gift,
  Heart,
  ImagePlus,
  Plus,
  Shuffle,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '../../hooks/auth.hooks';
import { getApiError } from '../../api/http';

import { getMyGroups } from '../../api/groups';

import {
  createSecretSantaEvent,
  getMySecretSantaEvents,
  uploadEventImage,
} from '../../api/secret_santa_events';

import {
  drawSecretSantaAssignments,
  getMySecretSantaAssignment,
  markGiftAsDelivered,
} from '../../api/secret_santa_assignments';

import type { Group } from '../../types/group.schema';

import type {
  SecretSantaEvent,
} from '../../types/secret_santa_events.schema';

import type {
  SecretSantaPrivateAssignment,
} from '../../types/secret_santa_assignments.schema';

import DrawConfirmationModal from './DrawConfirmationModal';

export default function ClientEvents() {
  const { user } = useAuth();

  // DATOS
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<SecretSantaEvent[]>([]);

  // ESTADOS GENERALES
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // FORMULARIO DEL EVENTO
  const [groupId, setGroupId] = useState('');
  const [name, setName] = useState('Amigo Secreto 2026');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('100');
  const [image, setImage] = useState<File | null>(null);

  // SORTEO
  const [
    pendingDrawEventId,
    setPendingDrawEventId,
  ] = useState<string | null>(null);

  // REGALO PRIVADO
  const [selectedEventId, setSelectedEventId] = useState('');

  const [assignment, setAssignment] =
    useState<SecretSantaPrivateAssignment | null>(null);

  // GRUPOS QUE ORGANIZA EL USUARIO
  const ownedGroups = groups.filter(
    (group) => group.ownerId === user?.id,
  );

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  const refresh = async () => {
    const [myGroups, myEvents] = await Promise.all([
      getMyGroups(),
      getMySecretSantaEvents(),
    ]);

    setGroups(myGroups);
    setEvents(myEvents);
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      getMyGroups(),
      getMySecretSantaEvents(),
    ])
      .then(([myGroups, myEvents]) => {
        if (!active) return;

        setGroups(myGroups);
        setEvents(myEvents);
      })
      .catch((cause) => {
        if (active) {
          setError(getApiError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // =====================================================
  // CANCELAR FORMULARIO
  // =====================================================

  const cancelCreate = () => {
    setShowForm(false);
    setGroupId('');
    setName('Amigo Secreto 2026');
    setDescription('');
    setBudget('100');
    setImage(null);
    setError('');
  };

  // =====================================================
  // CREAR EVENTO
  // =====================================================

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (busy || !groupId || !name.trim()) return;

    const value = budget.trim()
      ? Number(budget)
      : undefined;

    if (
      value !== undefined &&
      (!Number.isFinite(value) || value < 0)
    ) {
      setError('Ingresa un presupuesto válido.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const created = await createSecretSantaEvent({
        groupId,
        name: name.trim(),
        description: description.trim() || undefined,
        currencyCode: 'BOB',
        ...(value !== undefined ? { budget: value } : {}),
      });

      let imageError = '';

      // Subir portada a Cloudinary
      if (image) {
        try {
          await uploadEventImage(created.id, image);
        } catch (cause) {
          imageError = getApiError(cause);
        }
      }

      cancelCreate();

      if (imageError) {
        setError(
          `Evento creado, pero no se pudo subir su portada: ${imageError}`,
        );
      } else {
        setNotice(
          '¡Evento creado! Reúne a tus amigos antes de realizar el sorteo.',
        );
      }

      try {
        await refresh();
      } catch (cause) {
        setError(
          `El evento se guardó, pero no se pudo actualizar la lista: ${getApiError(cause)}`,
        );
      }
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // REALIZAR SORTEO SIN ALERT DEL NAVEGADOR
  // =====================================================

  const draw = async (eventId: string) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const result =
        await drawSecretSantaAssignments(eventId);

      setNotice(
        `¡Sorteo realizado con éxito! Participaron ${result.participants} personas. Cada una podrá consultar su resultado privado.`,
      );

      try {
        await refresh();
      } catch (cause) {
        setError(
          `El sorteo se guardó, pero no se pudo actualizar la lista: ${getApiError(cause)}`,
        );
      }
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setPendingDrawEventId(null);
      setBusy(false);
    }
  };

  // =====================================================
  // DESCUBRIR AMIGO SECRETO
  // =====================================================

  const reveal = async (eventId: string) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setSelectedEventId(eventId);
    setAssignment(null);

    try {
      const result =
        await getMySecretSantaAssignment(eventId);

      setAssignment(result);
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // MARCAR REGALO COMO ENTREGADO
  // =====================================================

  const deliver = async (eventId: string) => {
    if (
      busy ||
      !assignment ||
      selectedEventId !== eventId
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await markGiftAsDelivered(eventId);

      setAssignment({
        ...assignment,
        giftStatus: 'delivered',
      });

      setNotice('¡Tu regalo fue marcado como entregado!');

      try {
        await refresh();
      } catch (cause) {
        setError(
          `La entrega se guardó, pero no se pudo actualizar la lista: ${getApiError(cause)}`,
        );
      }
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <section className="space-y-7">

      {/* ENCABEZADO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black text-red-950">
            <CalendarHeart className="text-red-600" />
            Amigo Secreto
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Organiza tus intercambios y descubre a quién
            le darás una sorpresa.
          </p>
        </div>

        {ownedGroups.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                cancelCreate();
              } else {
                setShowForm(true);
              }
            }}
            disabled={busy}
            className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white shadow-md shadow-red-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98] disabled:opacity-50"
          >
            {showForm ? (
              <>
                <X size={18} />
                Cerrar formulario
              </>
            ) : (
              <>
                <Plus size={18} />
                Crear evento
              </>
            )}
          </button>
        )}
      </div>

      {/* MENSAJES */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}

      {/* ================================================= */}
      {/* CREAR EVENTO */}
      {/* ================================================= */}

      {showForm && (
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-5 rounded-3xl border border-red-100 bg-white p-6 shadow-sm"
        >
          <div>
            <h3 className="text-xl font-black text-red-950">
              Organizar una nueva celebración
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Selecciona un grupo y prepara tu próximo
              intercambio de regalos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <label className="block text-sm font-semibold text-red-950">
              Grupo de amigos *

              <select
                value={groupId}
                onChange={(event) =>
                  setGroupId(event.target.value)
                }
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-red-200 bg-white px-4 outline-none focus:border-red-500"
              >
                <option value="">
                  Selecciona un grupo
                </option>

                {ownedGroups.map((group) => (
                  <option
                    value={group.id}
                    key={group.id}
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-red-950">
              Nombre del evento *

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={120}
                required
                placeholder="Ej. Amigo Secreto 2026"
                className="mt-2 min-h-12 w-full rounded-xl border border-red-200 px-4 outline-none focus:border-red-500"
              />
            </label>

            <label className="block text-sm font-semibold text-red-950 sm:col-span-2">
              Descripción

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={3}
                maxLength={500}
                placeholder="Describe cómo será tu celebración..."
                className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </label>

            <label className="block text-sm font-semibold text-red-950 sm:col-span-2">
              Presupuesto aproximado (Bs)

              <input
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(event) =>
                  setBudget(event.target.value)
                }
                placeholder="Ej. 100"
                className="mt-2 min-h-12 w-full rounded-xl border border-red-200 px-4 outline-none focus:border-red-500"
              />
            </label>

          </div>

          {/* IMAGEN DE CLOUDINARY */}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/40 p-5 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50">
            <ImagePlus size={23} />

            <span className="min-w-0 flex-1 truncate">
              {image
                ? image.name
                : 'Seleccionar portada para el evento'}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                setImage(event.target.files?.[0] ?? null);
              }}
            />
          </label>

          {/* ACCIONES */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-red-100 pt-5">
            <button
              type="button"
              onClick={cancelCreate}
              disabled={busy}
              className="min-h-12 cursor-pointer rounded-xl border border-red-200 px-6 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={busy || !groupId || !name.trim()}
              className="min-h-12 cursor-pointer rounded-xl bg-red-700 px-6 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Guardando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      )}

      {/* ================================================= */}
      {/* LISTA DE EVENTOS */}
      {/* ================================================= */}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
          Cargando eventos...
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {events.map((event) => {
            const isOwner = ownedGroups.some(
              (group) => group.id === event.groupId,
            );

            const currentAssignment =
              selectedEventId === event.id
                ? assignment
                : null;

            const groupName =
              groups.find(
                (group) => group.id === event.groupId,
              )?.name ?? 'Grupo de amigos';

            const eventIsDrawn =
              event.status === 'drawn' ||
              event.status === 'completed';

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
              >
                {/* PORTADA */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-red-900 to-rose-500">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={`Portada de ${event.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/70">
                      <Gift size={68} strokeWidth={1.3} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/45 to-transparent" />

                  <span className="absolute bottom-4 left-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-red-800">
                    {event.status === 'draft'
                      ? 'Esperando sorteo'
                      : event.status === 'drawn'
                        ? 'Sorteo realizado'
                        : event.status === 'completed'
                          ? 'Finalizado'
                          : 'Cancelado'}
                  </span>
                </div>

                {/* INFORMACIÓN */}
                <div className="p-6">

                  <Link
                    to={`/home/groups/${event.groupId}`}
                    className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700 transition hover:text-red-900 hover:underline"
                  >
                    <Users size={16} />
                    {groupName}
                    <ArrowRight size={14} />
                  </Link>

                  <h3 className="mt-3 text-xl font-black text-red-950">
                    {event.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {event.description ||
                      'Intercambio de regalos entre amigos.'}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                      {event.budget != null
                        ? `Presupuesto: Bs ${event.budget}`
                        : 'Presupuesto libre'}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                      {eventIsDrawn
                        ? 'Participantes sorteados'
                        : event.status === 'draft'
                          ? 'En preparación'
                          : 'Evento cerrado'}
                    </span>
                  </div>

                  {/* ACCIONES DEL EVENTO */}
                  <div className="mt-6 flex flex-wrap gap-3">

                    {/* SOLO PROPIETARIO */}
                    {event.status === 'draft' && isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDrawEventId(event.id)
                        }
                        disabled={busy}
                        className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Shuffle size={18} />
                        Realizar sorteo
                      </button>
                    )}

                    {/* PARTICIPANTE */}
                    {eventIsDrawn && (
                      <button
                        type="button"
                        onClick={() => void reveal(event.id)}
                        disabled={busy}
                        className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Heart size={18} />
                        Descubrir mi amigo
                      </button>
                    )}

                  </div>

                  {/* RESULTADO PRIVADO */}
                  {currentAssignment && (
                    <div className="mt-7 rounded-3xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-5">

                      <div className="text-center">
                        <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 shadow-sm">
                          Tu Amigo Secreto
                        </span>

                        <div className="mt-5 flex justify-center">
                          {currentAssignment.receiver.avatarUrl ? (
                            <img
                              src={currentAssignment.receiver.avatarUrl}
                              alt={currentAssignment.receiver.name}
                              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                            />
                          ) : (
                            <span className="grid h-24 w-24 place-items-center rounded-full bg-red-100 text-red-700">
                              <UserRound size={43} />
                            </span>
                          )}
                        </div>

                        <h4 className="mt-4 text-2xl font-black text-red-950">
                          {currentAssignment.receiver.name}
                        </h4>

                        <p className="mt-2 text-sm text-slate-500">
                          ¡Prepara una sorpresa especial para esta persona!
                        </p>

                        {/* PERFIL DEL DESTINATARIO */}
                        <Link
                          to={`/home/groups/${event.groupId}/members/${currentAssignment.receiver.id}`}
                          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                        >
                          <UserRound size={17} />
                          Ver su perfil y sus deseos
                          <ArrowRight size={16} />
                        </Link>
                      </div>

                      {/* LISTA DE DESEOS */}
                      <div className="mt-6 rounded-2xl border border-red-100 bg-white p-5">
                        <h5 className="flex items-center gap-2 font-black text-red-950">
                          <Gift size={19} className="text-red-600" />
                          Su lista de deseos
                        </h5>

                        {currentAssignment.wishlist.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {currentAssignment.wishlist.map(
                              (wish, index) => (
                                <div
                                  key={`${wish.name}-${index}`}
                                  className="flex items-center gap-3 rounded-xl border border-red-100 p-3"
                                >
                                  {wish.imageUrl ? (
                                    <img
                                      src={wish.imageUrl}
                                      alt={wish.name}
                                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                                      <Gift size={24} />
                                    </span>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-red-950">
                                      {wish.name}
                                    </p>

                                    {wish.productUrl && (
                                      <a
                                        href={wish.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-red-700 hover:underline"
                                      >
                                        Ver producto
                                        <ArrowRight size={13} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            Esta persona todavía no compartió
                            deseos en el grupo.
                          </p>
                        )}
                      </div>

                      {/* REGALO ENTREGADO */}
                      <button
                        type="button"
                        onClick={() => void deliver(event.id)}
                        disabled={
                          busy ||
                          currentAssignment.giftStatus === 'delivered'
                        }
                        className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={19} />

                        {currentAssignment.giftStatus === 'delivered'
                          ? 'Regalo entregado'
                          : 'Ya entregué mi regalo'}
                      </button>
                    </div>
                  )}

                </div>
              </article>
            );
          })}

          {events.length === 0 && (
            <div className="rounded-3xl border border-dashed border-red-200 bg-white p-8 text-center lg:col-span-2">
              <Gift
                size={42}
                className="mx-auto text-red-300"
              />

              <h3 className="mt-4 text-lg font-black text-red-950">
                Todavía no tienes eventos
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Crea un grupo, invita a tus amigos
                y organiza tu primer Amigo Secreto.
              </p>

              <Link
                to="/home/my-space"
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
              >
                <Users size={18} />
                Ir a mis grupos
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL DE CONFIRMACIÓN */}
      {/* ================================================= */}

      <DrawConfirmationModal
        open={pendingDrawEventId !== null}
        loading={busy}
        onClose={() => {
          if (!busy) {
            setPendingDrawEventId(null);
          }
        }}
        onConfirm={() => {
          if (pendingDrawEventId) {
            void draw(pendingDrawEventId);
          }
        }}
      />

    </section>
  );
}
