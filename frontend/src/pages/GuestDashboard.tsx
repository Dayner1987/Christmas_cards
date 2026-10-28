
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

const MAX_WISHES = 5;

const christmasPhoto =
  'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1200&q=80';

export default function GuestDashboard() {
  const { groupId = '' } = useParams();
  const token = guestStorage.get(groupId);

  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [events, setEvents] = useState<GuestEvent[]>([]);
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [newWish, setNewWish] = useState('');

  const [assignment, setAssignment] =
    useState<SecretSantaPrivateAssignment | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Muestra un evento automáticamente.
  // Prioriza uno sorteado o finalizado sobre los pendientes.
 const selectedEventId = guest?.group?.selectedEventId;

const event = selectedEventId
  ? events.find((item) => item.id === selectedEventId)
  : events.length === 1
    ? events[0]
    : undefined;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const profile = await getGuestProfile(token);

        if (!active) return;

        setGuest(profile);
        setWishes(profile.wishlist ?? []);

        if ((profile.wishlist?.length ?? 0) > MAX_WISHES) {
          setNotice(
            'Tienes más de cinco deseos guardados. Elimina los adicionales antes de volver a guardar.',
          );
        }

        if (profile.status === 'active') {
          const found = await getGuestEvents(token);

          if (active) {
            setEvents(found);
          }
        }
      } catch (cause) {
        if (active) {
          setError(getApiError(cause));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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
    setNotice('');

    try {
      setGuest(await uploadGuestAvatar(token, file));
      setNotice('Fotografía actualizada correctamente.');
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const addWish = () => {
    const name = newWish.trim();

    if (wishes.length >= MAX_WISHES) {
      setError('Puedes agregar un máximo de cinco deseos.');
      return;
    }

    if (name.length < 2) {
      setError('El deseo debe tener al menos dos caracteres.');
      return;
    }

    if (
      wishes.some(
        (wish) => wish.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError('Ese deseo ya está en tu lista.');
      return;
    }

    setWishes((current) => [...current, { name }]);

    setNewWish('');
    setError('');
    setNotice('');
  };

  const saveWishes = async () => {
    if (!token || busy) return;

    if (wishes.length > MAX_WISHES) {
      setError(
        'Elimina los deseos adicionales. Solo puedes guardar cinco.',
      );
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

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
    if (!token || !event || busy) return;

    setBusy(true);
    setError('');
    setAssignment(null);

    try {
      setAssignment(await getGuestAssignment(event.id, token));
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const deliver = async () => {
    if (!token || !event || !assignment || busy) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await markGuestGiftDelivered(event.id, token);

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
    <main className="min-h-screen bg-[#fff8f5] pb-16 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-red-800 hover:underline"
        >
          <ArrowLeft size={17} />
          ChristmasCards
        </Link>

        {loading && (
          <p className="rounded-2xl bg-white p-6 text-slate-600">
            Cargando tu grupo...
          </p>
        )}

        {!token && (
          <p
            role="alert"
            className="rounded-2xl bg-amber-50 p-5 text-amber-900"
          >
            No encontramos tu invitación en este navegador.
            Abre nuevamente el enlace que te compartió el organizador.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
          >
            {notice}
          </p>
        )}

        {guest && (
          <div className="space-y-7">
            {/* PORTADA DEL GRUPO */}
            <section className="relative overflow-hidden rounded-[2rem] bg-red-950 text-white shadow-xl">
              <img
                src={guest.group?.imageUrl || christmasPhoto}
                alt="Portada de la celebración"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-red-950/95 via-red-950/80 to-red-950/30" />

              <div className="relative max-w-2xl p-8 sm:p-12">
                <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold uppercase">
                  Tu celebración
                </span>

                <h1 className="mt-7 text-3xl font-black sm:text-4xl">
                  ¡Hola, {guest.name}!
                </h1>

                <p className="mt-4 text-xl font-bold text-rose-100">
                  {guest.group?.name || 'Mi grupo'}
                </p>

                <p className="mt-3 max-w-lg text-sm leading-7 text-red-100">
                  {guest.group?.description ||
                    'Comparte tus deseos y disfruta de una Navidad especial.'}
                </p>
              </div>
            </section>

            {/* PERFIL */}
            <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              {guest.avatarUrl ? (
                <img
                  src={guest.avatarUrl}
                  alt={guest.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-2xl font-black text-red-700">
                  {guest.name.charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="font-black text-red-950">
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
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  className="sr-only"
                  onChange={(e) => {
                    void uploadAvatar(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </section>

            {/* MIEMBROS */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                <Users size={22} className="text-red-600" />
                Nuestro grupo
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Las personas con quienes compartirás esta celebración.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(guest.members ?? []).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-red-100 p-3"
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-100 font-black text-red-700">
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
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                    <Heart size={22} className="text-red-600" />
                    Mi lista de deseos
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Agrega hasta cinco objetos que te gustaría recibir.
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                  {wishes.length} / {MAX_WISHES} deseos
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {wishes.length === 0 && (
                  <p className="rounded-xl bg-[#fff8f5] p-4 text-sm text-slate-500">
                    Todavía no añadiste ningún deseo.
                  </p>
                )}

                {wishes.map((wish, index) => (
                  <div
                    key={`${wish.name}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-red-100 p-3"
                  >
                    <Gift size={17} className="shrink-0 text-red-600" />

                    <span className="min-w-0 flex-1 break-words text-sm font-semibold">
                      {wish.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setWishes((current) =>
                          current.filter((_, i) => i !== index),
                        );
                        setNotice('');
                      }}
                      aria-label={`Eliminar ${wish.name}`}
                      className="cursor-pointer rounded-lg p-2 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addWish();
                      }
                    }}
                    maxLength={150}
                    disabled={wishes.length >= MAX_WISHES}
                    placeholder={
                      wishes.length >= MAX_WISHES
                        ? 'Alcanzaste el límite de cinco deseos'
                        : 'Ej. Libro, chocolate, audífonos...'
                    }
                    className="min-h-12 min-w-0 flex-1 rounded-xl border border-red-200 px-4 text-sm outline-none focus:border-red-600 disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={addWish}
                    disabled={wishes.length >= MAX_WISHES}
                    aria-label="Agregar deseo"
                    className="grid h-12 w-12 cursor-pointer place-items-center rounded-xl bg-red-100 text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={21} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void saveWishes()}
                  disabled={busy || wishes.length > MAX_WISHES}
                  className="min-h-12 w-full cursor-pointer rounded-xl bg-red-700 font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? 'Guardando...' : 'Guardar mis deseos'}
                </button>
              </div>
            </section>

            {/* EVENTO AUTOMÁTICO */}
            <section className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-xl font-black text-red-950">
                  <CalendarHeart size={22} className="text-red-600" />
                  Nuestro Amigo Secreto
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  La celebración aparece automáticamente cuando
                  el organizador la prepara.
                </p>
              </div>

              {guest.status !== 'active' ? (
                <p className="mx-6 mb-7 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  Podrás participar cuando el organizador apruebe tu ingreso.
                </p>
              ) : !event ? (
                <p className="mx-6 mb-7 rounded-xl bg-red-50 p-4 text-sm text-slate-600">
                  Tu grupo todavía no tiene un evento de Amigo Secreto.
                </p>
              ) : (
                <div className="mx-6 mb-7 overflow-hidden rounded-2xl border border-red-100 sm:mx-8">
                  <img
                    src={event.imageUrl || christmasPhoto}
                    alt={event.name}
                    className="h-44 w-full object-cover sm:h-52"
                  />

                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-black text-red-950">
                        {event.name}
                      </h3>

                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-800">
                        {event.status === 'draft'
                          ? 'Esperando sorteo'
                          : event.status === 'drawn'
                            ? 'Sorteo realizado'
                            : 'Finalizado'}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {event.description ||
                        'Intercambio de regalos entre amigos.'}
                    </p>

                    {event.budget != null && (
                      <p className="mt-3 text-sm font-bold text-red-700">
                        Presupuesto: {event.currencyCode || 'BOB'}{' '}
                        {event.budget}
                      </p>
                    )}

                    {event.status === 'draft' ? (
                      <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                        El organizador todavía no ha realizado el sorteo.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void reveal()}
                        disabled={busy}
                        className="mt-5 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800 disabled:opacity-50"
                      >
                        <Gift size={18} />
                        {busy
                          ? 'Descubriendo...'
                          : 'Descubrir mi Amigo Secreto'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* RESULTADO DEL SORTEO */}
              {assignment && (
                <div className="mx-6 mb-8 rounded-2xl border border-red-200 bg-[#fff8f5] p-6 text-center sm:mx-8">
                  <p className="text-sm font-bold uppercase tracking-wider text-red-700">
                    Te tocó regalar a
                  </p>

                  {assignment.receiver.avatarUrl && (
                    <img
                      src={assignment.receiver.avatarUrl}
                      alt={assignment.receiver.name}
                      className="mx-auto mt-5 h-24 w-24 rounded-full object-cover"
                    />
                  )}

                  <h3 className="mt-4 text-3xl font-black text-red-950">
                    {assignment.receiver.name}
                  </h3>

                  <div className="mt-6 rounded-xl bg-white p-5 text-left">
                    <h4 className="font-black text-red-950">
                      Su lista de deseos
                    </h4>

                    {assignment.wishlist.length ? (
                      <div className="mt-3 space-y-3">
                        {assignment.wishlist.map((wish, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-red-100 p-3"
                          >
                            <p className="text-sm font-semibold">
                              {wish.name}
                            </p>

                            {wish.productUrl && (
                              <a
                                href={wish.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm font-bold text-red-700 hover:underline"
                              >
                                Ver producto
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        Esta persona todavía no compartió sus deseos.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void deliver()}
                    disabled={
                      busy || assignment.giftStatus === 'delivered'
                    }
                    className="mt-6 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    {assignment.giftStatus === 'delivered'
                      ? 'Regalo entregado'
                      : 'Ya entregué el regalo'}
                  </button>
                </div>
              )}
            </section>

            {/* REGISTRO OPCIONAL */}
            {guest.status === 'active' &&
              (showRegister ? (
                <GuestRegisterForm
                  token={token!}
                  groupId={groupId}
                  onCancel={() => setShowRegister(false)}
                />
              ) : (
                <section className="rounded-3xl bg-gradient-to-r from-red-950 to-red-700 p-7 text-white sm:p-9">
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div>
                      <h2 className="text-2xl font-black">
                        ¿Quieres crear tu propia celebración?
                      </h2>

                      <p className="mt-3 max-w-lg text-sm leading-7 text-red-100">
                        Crea tu cuenta y conserva tu participación actual
                        mientras organizas grupos y envías tarjetas.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-5 font-bold text-red-800 hover:bg-red-50"
                    >
                      <UserPlus size={18} />
                      Crear mi cuenta
                    </button>
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
