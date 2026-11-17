
 // src/pages/client/ClientGroupDetailsPage.tsx

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GroupEventSelector from '../../components/client/GroupEventSelector';
import OrganizerAssignments from '../../components/client/OrganizerAssignments';

import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Copy,
  Gift,
  QrCode,
  Users,
  X,
} from 'lucide-react';

import { ImagePlus, Trash2 } from 'lucide-react';

import {
  uploadGroupImage,
  removeGroupImage,
} from '../../api/groups';

import {
  getGroupById,
  getInvitationQr,
} from '../../api/groups';

import { getGroupMembers } from '../../api/group-members';
import { getSecretSantaEventsByGroup } from '../../api/secret_santa_events';
import { getApiError } from '../../api/http';

import type { Group } from '../../types/group.schema';
import type { GroupMember } from '../../types/group_members.schema';
import type { SecretSantaEvent } from '../../types/secret_santa_events.schema';

import { useAuth } from '../../hooks/auth.hooks';

export default function ClientGroupDetailsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<SecretSantaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

const [savingImage, setSavingImage] = useState(false);

const changeGroupImage = async (file?: File) => {
  if (!file || !groupId || savingImage) return;

  setSavingImage(true);
  setError('');
  setNotice('');

  try {
    const updated = await uploadGroupImage(groupId, file);

    setGroup(updated);
    setNotice('La fotografía del grupo se actualizó correctamente.');
  } catch (cause) {
    setError(getApiError(cause));
  } finally {
    setSavingImage(false);
  }
};

const deleteGroupImage = async () => {
  if (!groupId || savingImage) return;

  setSavingImage(true);
  setError('');

  try {
    const updated = await removeGroupImage(groupId);

    setGroup(updated);
    setNotice('Se eliminó la fotografía del grupo.');
  } catch (cause) {
    setError(getApiError(cause));
  } finally {
    setSavingImage(false);
  }
};

  const [qr, setQr] = useState<{
    qrDataUrl: string;
    invitationUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!groupId) {
      setError('No se identificó el grupo.');
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      getGroupById(groupId),
      getGroupMembers(groupId),
      getSecretSantaEventsByGroup(groupId),
    ])
      .then(([groupData, memberData, eventData]) => {
        if (!active) return;

        setGroup(groupData);
        setMembers(memberData);
        setEvents(eventData);
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
  }, [groupId]);

  const copyInvitation = async () => {
    if (!group?.invitationUrl) return;

    try {
      await navigator.clipboard.writeText(group.invitationUrl);
      setNotice('Enlace de invitación copiado.');
    } catch {
      setError('No se pudo copiar el enlace.');
    }
  };

  const showQr = async () => {
    if (!groupId) return;

    try {
      setQr(await getInvitationQr(groupId));
    } catch (cause) {
      setError(getApiError(cause));
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-slate-500">Cargando grupo...</p>;
  }

  if (!group) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-800">
        {error || 'No se encontró el grupo.'}
        <Link to="/home/my-space" className="mt-4 block font-bold underline">
          Volver a mis grupos
        </Link>
      </div>
    );
  }

  const isOwner = group.ownerId === user?.id;

  return (
    <div className="space-y-9">
      <Link
        to="/home/my-space"
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-red-700 hover:underline"
      >
        <ArrowLeft size={17} />
        Mis grupos
      </Link>

      {/* PORTADA */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-red-950 to-red-600 text-white">
        <div className="relative h-56 sm:h-72">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={`Portada de ${group.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Users size={80} strokeWidth={1.2} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-red-900/25 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 sm:left-9">
            <p className="text-xs font-bold uppercase tracking-widest text-red-100">
              Grupo de amigos
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {group.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:px-9">
          <div>
            <p className="text-sm text-red-100">
              {group.description || 'Un lugar para compartir entre amigos.'}
            </p>

            <p className="mt-2 text-sm font-semibold">
              {members.length} participantes
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyInvitation()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold transition hover:bg-white/25"
              >
                <Copy size={17} />
                Invitar
              </button>

              <button
                type="button"
                onClick={() => void showQr()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-800 transition hover:bg-red-50"
              >
                <QrCode size={17} />
                QR
              </button>
              
{isOwner && (
  <>
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-white/25">
      <ImagePlus size={18} />

      {savingImage ? 'Subiendo...' : 'Cambiar portada'}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={savingImage}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          void changeGroupImage(file);

          event.target.value = '';
        }}
      />
    </label>

    {group.imageUrl && (
      <button
        type="button"
        disabled={savingImage}
        onClick={() => void deleteGroupImage()}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-950/30 disabled:opacity-50"
      >
        <Trash2 size={17} />
        Quitar portada
      </button>
    )}
  </>
)}

            </div>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
          {notice}
        </p>
      )}

      {/* INTEGRANTES */}
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
          <Users className="text-red-600" />
          Nuestros amigos
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Conoce a los integrantes y descubre los deseos que han compartido.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const name = member.isGuest
              ? member.guestName || 'Invitado'
              : [
                  member.user?.firstName,
                  member.user?.lastName,
                ].filter(Boolean).join(' ').trim() ||
                member.user?.username ||
                'Usuario';

            const avatar = member.isGuest
              ? member.guestAvatarUrl
              : member.user?.avatarUrl;

            return (
              <Link
                key={member.id}
                to={`/home/groups/${group.id}/members/${member.id}`}
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-300 hover:shadow-lg"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-red-100 text-2xl font-black text-red-700">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-red-950">
                    {name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {member.role === 'owner'
                      ? 'Organizador'
                      : member.isGuest
                        ? 'Invitado'
                        : 'Miembro'}
                  </p>

                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-600">
                    Ver perfil
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
{/* SOLO EL ORGANIZADOR ELIGE EL EVENTO */}
{isOwner && (
  <GroupEventSelector
    group={group}
    events={events}
    onSaved={(updated, createdEvent) => {
      setGroup(updated);
      if (createdEvent) {
        setEvents((previous) => previous.some((item) => item.id === createdEvent.id)
          ? previous.map((item) => item.id === createdEvent.id ? createdEvent : item)
          : [createdEvent, ...previous]);
      }
    }}
  />
)}
      {/* EVENTOS DEL GRUPO */}
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
          <CalendarHeart className="text-red-600" />
          Celebraciones del grupo
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex items-center gap-4 rounded-2xl border border-red-100 bg-white p-5"
            >
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-xl bg-red-100 text-red-700">
                  <Gift size={32} />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-red-950">{event.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {event.status === 'draft' ? 'Por sortear' : event.status === 'drawn' ? 'Sorteado' : 'Evento finalizado o cancelado'}
                </p>
                <Link
                  to="/home/events"
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-red-700 hover:underline"
                >
                  Ir al evento <ArrowRight size={15} />
                </Link>
                
{isOwner &&
  ['drawn', 'completed'].includes(event.status) && (
    <OrganizerAssignments
      eventId={event.id}
      groupId={group.id}
    />
  )}

              </div>
            </article>
          ))}
        </div>

        {!events.length && (
          <p className="mt-4 rounded-xl bg-white p-6 text-sm text-slate-500">
            Este grupo aún no ha organizado ningún evento.
          </p>
        )}
      </section>

      {qr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR de invitación"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center">
            <button
              type="button"
              onClick={() => setQr(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 cursor-pointer text-red-700"
            >
              <X />
            </button>

            <h3 className="text-xl font-black text-red-950">
              Invita a tus amigos
            </h3>

            <img
              src={qr.qrDataUrl}
              alt="Código QR del grupo"
              className="mx-auto my-5 h-60 w-60"
            />

            <p className="break-all text-xs text-slate-500">
              {qr.invitationUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
