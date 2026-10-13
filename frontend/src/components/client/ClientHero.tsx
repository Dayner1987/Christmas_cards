
 // src/components/client/ClientHero.tsx

import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Users } from 'lucide-react';

import { useAuth } from '../../hooks/auth.hooks';

const heroImage =
  'https://images.unsplash.com/photo-1638274307910-e89c61d6334c?auto=format&fit=crop&w=1100&q=85';

export default function ClientHero() {
  const { user } = useAuth();

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-950 via-red-800 to-rose-600 text-white shadow-xl shadow-red-900/15">
      <div className="grid min-h-[430px] items-stretch lg:grid-cols-[1.1fr_0.9fr]">

        <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12">
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-100">
            Una Navidad para recordar
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            ¡Hola, {user?.firstName || user?.username || 'amigo'}!
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-red-100 sm:text-lg">
            Los regalos más especiales nacen de compartir
            con quienes queremos. Reúne a tus amigos,
            descubre sus deseos y crea momentos inolvidables.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/home/my-space"
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-red-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95"
            >
              <Users size={18} />
              Mis grupos
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/home/events"
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <Gift size={18} />
              Amigo Secreto
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
          <img
            src={heroImage}
            alt="Regalos de Navidad envueltos con cintas rojas"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-red-900/35 lg:to-transparent" />

          <span className="absolute bottom-6 right-6 rounded-xl border border-white/20 bg-red-950/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
            Compartir también es regalar
          </span>
        </div>
      </div>
    </section>
  );
}
