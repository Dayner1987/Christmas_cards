
 // src/pages/GuestDashboard.tsx

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  CalendarHeart,
  CheckCircle2,
  Gift,
  Heart,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

import {
  getGuestProfile,
  getGuestEvents,
  saveGuestWishlist,
  uploadGuestAvatar,
} from '../api/guests';

import type {
  GuestEvent,
  GuestProfile,
  GuestWish,
} from '../api/guests';

import {
  getGuestAssignment,
  markGuestGiftDelivered,
} from '../api/secret_santa_assignments';

import type {
  SecretSantaPrivateAssignment,
} from '../types/secret_santa_assignments.schema';

import { guestStorage } from '../config/guest.storage';
import { getApiError } from '../api/http';

import GuestRegisterForm from '../components/client/GuestRegisterForm';

export default function GuestDashboard() {
  const { groupId = '' } = useParams();
  const token = guestStorage.get(groupId);

  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [events, setEvents] = useState<GuestEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [newWish, setNewWish] = useState('');

  const [assignment, setAssignment] =
    useState<SecretSantaPrivateAssignment | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedEvent = events.find(
    (event) => event.id === eventId,
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const profile = await getGuestProfile(token);

        if (!active) return;

        setGuest(profile);
        setWishes(profile.wishlist ?? []);

        if (profile.status === 'active') {
          const myEvents = await getGuestEvents(token);

          if (!active) return;

          setEvents(myEvents);

          const firstEvent =
            myEvents.find(
              (event) =>
                event.status === 'drawn' ||
                event.status === 'completed',
            ) ?? myEvents[0];

          setEventId(firstEvent?.id ?? '');
        }
      } catch (cause) {
        if (active) setError(getApiError(cause));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [token]);

  const uploadAvatar = async (file?: File) => {
    if (!file || !token || busy) return;

    setBusy(true);
    setError('');

    try {
      setGuest(await uploadGuestAvatar(token, file));
      setNotice('Fotografía actualizada.');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const addWish = () => {
    const name = newWish.trim();

    if (name.length < 2 || wishes.length >= 30) return;

    setWishes((current) => [...current, { name }]);
    setNewWish('');
    setNotice('');
  };

  const saveWishes = async () => {
    if (!token || busy) return;

    setBusy(true);
    setError('');

    try {
      const updated = await saveGuestWishlist(token, wishes);

      setGuest(updated);
      setWishes(updated.wishlist ?? []);
      setNotice('Tu lista de deseos se guardó correctamente.');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const reveal = async () => {
    if (!token || !eventId || busy) return;

    setBusy(true);
    setError('');
    setAssignment(null);

    try {
      const result = await getGuestAssignment(eventId, token);
      setAssignment(result);
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const deliver = async () => {
    if (!token || !eventId || !assignment || busy) return;

    setBusy(true);
    setError('');

    try {
      await markGuestGiftDelivered(eventId, token);

      setAssignment({
        ...assignment,
        giftStatus: 'delivered',
      });

      setNotice('¡Tu regalo se marcó como entregado!');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff8f5] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-red-800 hover:underline"
        >
          <ArrowLeft size={17} />
          ChristmasCards
        </Link>

        {loading && (
          <p className="rounded-2xl bg-white p-6 text-slate-500">
            Cargando tu grupo...
          </p>
        )}

        {!token && (
          <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-amber-900">
            No encontramos tu invitación guardada en este navegador.
            Solicita al organizador un nuevo enlace para entrar.
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-900">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        {guest && (
          <>
            {/* PORTADA DEL GRUPO */}
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-red-950 to-red-600 text-white shadow-xl">
              {guest.group?.imageUrl && (
                <img
                  src={guest.group.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-red-950/95 via-red-900/85 to-red-800/50" />

              <div className="relative p-7 sm:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase">
                  <Sparkles size={16} />
                  Invitado especial
                </span>

                <h1 className="mt-6 text-3xl font-black sm:text-4xl">
                  ¡Hola, {guest.name}!
                </h1>

                <p className="mt-3 text-lg font-bold">
                  {guest.group?.name || 'Mi grupo de amigos'}
                </p>

                <p className="mt-2 max-w-xl text-sm leading-7 text-red-100">
                  {guest.group?.description ||
                    'Celebremos juntos y compartamos nuestros mejores deseos.'}
                </p>
              </div>
            </section>

            {/* MI PERFIL */}
            <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              {guest.avatarUrl ? (
                <img
                  src={guest.avatarUrl}
                  alt={guest.name}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-red-100 text-red-700">
                  <Users size={33} />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-red-950">
                  {guest.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {guest.status === 'active'
                    ? 'Participante activo'
                    : 'Esperando aprobación del organizador'}
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50">
                <ImagePlus size={18} />
                Cambiar foto

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  className="sr-only"
                  onChange={(event) => {
                    void uploadAvatar(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
            </section>

            {/* AMIGOS DEL GRUPO */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                <Users className="text-red-600" size={23} />
                Nuestro grupo
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Las personas con quienes compartirás esta celebración.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(guest.members ?? []).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl border border-red-100 p-3"
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 font-black text-red-700">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-red-950">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.role === 'owner'
                          ? 'Organizador'
                          : member.isGuest
                            ? 'Invitado'
                            : 'Miembro'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* LISTA DE DESEOS */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                <Heart className="text-red-600" size={23} />
                Mi lista de deseos
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                ¿Qué te gustaría recibir en esta celebración?
              </p>

              <div className="mt-5 space-y-3">
                {wishes.map((wish, index) => (
                  <div
                    key={`${wish.name}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-red-100 p-3"
                  >
                    <Gift size={18} className="text-red-600" />

                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      {wish.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setWishes((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Eliminar ${wish.name}`}
                      className="cursor-pointer rounded-lg p-2 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    value={newWish}
                    onChange={(event) => setNewWish(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addWish();
                      }
                    }}
                    maxLength={150}
                    placeholder="Ej. Libro, chocolate, audífonos..."
                    className="min-h-12 min-w-0 flex-1 rounded-xl border border-red-200 px-4 outline-none focus:border-red-600"
                  />

                  <button
                    type="button"
                    onClick={addWish}
                    disabled={wishes.length >= 30}
                    className="grid h-12 w-12 cursor-pointer place-items-center rounded-xl bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40"
                    aria-label="Agregar deseo"
                  >
                    <Plus size={22} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void saveWishes()}
                  disabled={busy}
                  className="min-h-12 w-full cursor-pointer rounded-xl bg-red-700 font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
                >
                  Guardar mis deseos
                </button>
              </div>
            </section>

            {/* EVENTOS DEL GRUPO */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                <CalendarHeart className="text-red-600" size={23} />
                Nuestros eventos
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Selecciona una celebración para descubrir
                a quién debes regalarle.
              </p>

              {guest.status === 'pending' && (
                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Podrás participar cuando el organizador apruebe tu ingreso.
                </p>
              )}

              {guest.status === 'active' && (
                <>
                  <select
                    value={eventId}
                    onChange={(event) => {
                      setEventId(event.target.value);
                      setAssignment(null);
                    }}
                    className="mt-5 min-h-12 w-full cursor-pointer rounded-xl border border-red-200 bg-white px-4 outline-none focus:border-red-600"
                  >
                    <option value="">Selecciona un evento</option>

                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} — {
                          event.status === 'draft'
                            ? 'Pendiente de sorteo'
                            : event.status === 'drawn'
                              ? 'Sorteado'
                              : 'Finalizado'
                        }
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-red-100">
                      {selectedEvent.imageUrl && (
                        <img
                          src={selectedEvent.imageUrl}
                          alt={selectedEvent.name}
                          className="h-40 w-full object-cover"
                        />
                      )}

                      <div className="p-5">
                        <h3 className="text-lg font-black text-red-950">
                          {selectedEvent.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {selectedEvent.description ||
                            'Intercambio de regalos entre amigos.'}
                        </p>

                        {selectedEvent.budget != null && (
                          <p className="mt-3 text-sm font-bold text-red-700">
                            Presupuesto: Bs {selectedEvent.budget}
                          </p>
                        )}

                        {selectedEvent.status === 'draft' ? (
                          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                            El organizador todavía no ha realizado el sorteo.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void reveal()}
                            disabled={busy}
                            className="mt-5 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-6 font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
                          >
                            <Gift size={19} />
                            {busy ? 'Descubriendo...' : 'Descubrir mi Amigo Secreto'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {events.length === 0 && (
                    <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-slate-500">
                      Tu grupo todavía no tiene celebraciones.
                    </p>
                  )}

                  {assignment && (
                    <div className="mt-6 rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center">
                      <Sparkles size={30} className="mx-auto text-red-600" />

                      <p className="mt-3 text-sm font-bold uppercase text-red-700">
                        Tu persona especial es
                      </p>

                      {assignment.receiver.avatarUrl && (
                        <img
                          src={assignment.receiver.avatarUrl}
                          alt={assignment.receiver.name}
                          className="mx-auto mt-5 h-24 w-24 rounded-full object-cover"
                        />
                      )}

                      <h3 className="mt-3 text-3xl font-black text-red-950">
                        {assignment.receiver.name}
                      </h3>

                      <div className="mt-6 rounded-2xl bg-white p-5 text-left">
                        <h4 className="font-black text-red-950">
                          Sus deseos
                        </h4>

                        {assignment.wishlist.length ? (
                          <div className="mt-3 space-y-3">
                            {assignment.wishlist.map((wish, index) => (
                              <div
                                key={index}
                                className="rounded-xl border border-red-100 p-3"
                              >
                                <p className="font-semibold">{wish.name}</p>

                                {wish.productUrl && (
                                  <a
                                    href={wish.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-block cursor-pointer text-sm font-bold text-red-700 hover:underline"
                                  >
                                    Ver producto
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            Esta persona todavía no compartió deseos.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void deliver()}
                        disabled={busy || assignment.giftStatus === 'delivered'}
                        className="mt-6 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-6 font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
                      >
                        <CheckCircle2 size={19} />
                        {assignment.giftStatus === 'delivered'
                          ? 'Regalo entregado'
                          : 'Ya entregué el regalo'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* REGISTRO */}
            {guest.status === 'active' && (
              showRegister ? (
                <GuestRegisterForm
                  token={token!}
                  groupId={groupId}
                  onCancel={() => setShowRegister(false)}
                />
              ) : (
                <section className="rounded-3xl bg-gradient-to-r from-red-950 to-red-700 p-7 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div>
                      <h2 className="text-2xl font-black">
                        ¿Te gustaría quedarte?
                      </h2>

                      <p className="mt-3 max-w-xl text-sm leading-7 text-red-100">
                        Crea una cuenta para gestionar tu perfil,
                        crear tus propios grupos y enviar tarjetas.
                        Conservaremos tu participación actual.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-5 font-bold text-red-800 transition hover:bg-red-50"
                    >
                      <UserPlus size={19} />
                      Crear mi cuenta
                    </button>
                  </div>
                </section>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}
