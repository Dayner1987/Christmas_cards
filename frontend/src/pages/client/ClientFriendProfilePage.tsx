import PublicProfileHeader from '../../components/profile/PublicProfileHeader';

 // src/pages/client/ClientFriendProfilePage.tsx

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  ExternalLink,
  Gift,
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

      <PublicProfileHeader name={profile.name} username={profile.username||undefined} avatar={profile.avatarUrl} lists={profile.wishlists.length} wishes={wishCount} guest={profile.isGuest}/>

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
