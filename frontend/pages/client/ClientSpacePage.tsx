
 // src/pages/client/ClientSpacePage.tsx

import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';

import ClientGroups from '../../components/client/ClientGroups';
import ClientWishlist from '../../components/client/ClientWishlist';
import { useAuth } from '../../hooks/auth.hooks';

export default function ClientSpacePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl bg-gradient-to-r from-red-900 to-rose-600 p-7 text-white">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Mi fotografía"
            className="h-20 w-20 rounded-full border-4 border-white/30 object-cover"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/15">
            <UserRound size={38} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm text-red-100">Mi espacio personal</p>

          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            {user?.firstName || user?.username}
            {user?.lastName ? ` ${user.lastName}` : ''}
          </h1>

          <p className="mt-1 text-sm text-red-100">
            @{user?.username}
          </p>
        </div>

        <Link
          to="/perfil/editar"
          className="cursor-pointer rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-800 transition hover:bg-red-50"
        >
          Editar perfil
        </Link>
      </section>

      <ClientGroups />

      <div className="border-t border-red-100" />

      <div id="deseos" className="scroll-mt-28">
        <ClientWishlist />
      </div>
    </div>
  );
}
