
 // src/pages/client/ClientFriendProfilePage.tsx

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  ExternalLink,
  Gift,
  Heart,
  UserRound,
} from 'lucide-react';

import {
  getFriendProfile,
} from '../../api/group-social';

import type { FriendProfile } from '../../api/group-social';
import { getApiError } from '../../api/http';

export default function ClientFriendProfilePage() {
  const { groupId, memberId } = useParams<{
    groupId: string;
    memberId: string;
  }>();

  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId || !memberId) {
      setLoading(false);
      setError('Faltan los datos del perfil.');
      return;
    }

    let active = true;

    getFriendProfile(groupId, memberId)
      .then((data) => {
        if (active) setProfile(data);
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
  }, [groupId, memberId]);

  const back = `/home/groups/${groupId}`;

  if (loading) {
    return <p className="py-12 text-slate-500">Cargando perfil...</p>;
  }

  if (!profile) {
    return (
      <section className="rounded-2xl bg-red-50 p-6 text-red-800">
        <p>{error || 'Perfil no disponible.'}</p>
        <Link to={back} className="mt-4 inline-block font-bold underline">
          Volver al grupo
        </Link>
      </section>
    );
  }

  const wishCount = profile.wishlists.reduce(
    (sum, list) => sum + list.items.length,
    0,
  );

  return (
    <div className="space-y-8">
      <Link
        to={back}
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-red-700 hover:underline"
      >
        <ArrowLeft size={17} />
        Volver al grupo
      </Link>

      {/* PERFIL */}
      <section className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
        <div className="h-36 bg-gradient-to-r from-red-950 via-red-700 to-rose-500" />

        <div className="relative px-6 pb-7 sm:px-9">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="-mt-12 h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <span className="-mt-12 grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-red-100 text-red-700 shadow-lg">
              <UserRound size={43} />
            </span>
          )}

          <h1 className="mt-4 text-3xl font-black text-red-950">
            {profile.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {profile.isGuest
              ? 'Participante invitado'
              : `@${profile.username}`}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <Heart size={16} />
            {wishCount} deseos compartidos
          </div>
        </div>
      </section>

      {/* DESEOS */}
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
          <Gift className="text-red-600" />
          Lo que le gustaría recibir
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Estas son las listas que decidió compartir con su grupo.
        </p>

        <div className="mt-6 space-y-8">
          {profile.wishlists.map((list) => (
            <section key={list.id}>
              <h3 className="mb-4 text-lg font-black text-red-900">
                {list.name}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.items.map((wish) => (
                  <article
                    key={wish.id}
                    className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm"
                  >
                    {wish.imageUrl ? (
                      <img
                        src={wish.imageUrl}
                        alt={wish.name}
                        loading="lazy"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-36 place-items-center bg-red-50 text-red-300">
                        <Gift size={48} strokeWidth={1.3} />
                      </div>
                    )}

                    <div className="p-5">
                      <h4 className="font-bold text-red-950">
                        {wish.name}
                      </h4>

                      {wish.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {wish.description}
                        </p>
                      )}

                      {wish.estimatedPrice && (
                        <p className="mt-3 text-sm font-bold text-red-700">
                          Aproximadamente Bs {wish.estimatedPrice}
                        </p>
                      )}

                      {wish.productUrl && (
                        <a
                          href={wish.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-red-700 hover:underline"
                        >
                          Ver regalo
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {wishCount === 0 && (
          <p className="mt-5 rounded-2xl border border-dashed border-red-200 bg-white p-8 text-sm text-slate-500">
            Este amigo todavía no ha compartido deseos.
          </p>
        )}
      </section>
    </div>
  );
}
