
 // src/pages/client/ClientHome.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  CalendarHeart,
  Gift,
  Heart,
  Users,
} from 'lucide-react';

import ClientHero from '../../components/client/ClientHero';
import ClientCards from '../../components/client/ClientCards';
import RevealOnScroll from '../../components/client/RevealOnScroll';

import { getMyGroups } from '../../api/groups';
import { getMySecretSantaEvents } from '../../api/secret_santa_events';

import type { Group } from '../../types/group.schema';
import type { SecretSantaEvent } from '../../types/secret_santa_events.schema';

const photos = {
  gifts:
    'https://images.unsplash.com/photo-1638274307910-e89c61d6334c?auto=format&fit=crop&w=900&q=80',
  tree:
    'https://images.unsplash.com/photo-1639043518653-fa5b8f6e7263?auto=format&fit=crop&w=900&q=80',
  ornaments:
    'https://images.unsplash.com/photo-1763351866520-a9e3d5489eb6?auto=format&fit=crop&w=900&q=80',
};

const sections = [
  {
    title: 'Una Navidad entre amigos',
    description:
      'Crea tu grupo, comparte el QR e invita a las personas que más quieres.',
    image: photos.tree,
    path: '/home/my-space',
    action: 'Explorar mis grupos',
    icon: Users,
  },
  {
    title: 'Sorpresas inolvidables',
    description:
      'Organiza un Amigo Secreto y descubre a quién le darás un regalo.',
    image: photos.gifts,
    path: '/home/events',
    action: 'Ver eventos',
    icon: CalendarHeart,
  },
  {
    title: 'Deseos que se cumplen',
    description:
      'Comparte tus regalos favoritos y conoce los deseos de tus amigos.',
    image: photos.ornaments,
    path: '/home/my-space#deseos',
    action: 'Mis deseos',
    icon: Heart,
  },
];

export default function ClientHome() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<SecretSantaEvent[]>([]);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      getMyGroups(),
      getMySecretSantaEvents(),
    ]).then(([groupResult, eventResult]) => {
      if (!active) return;

      if (groupResult.status === 'fulfilled') {
        setGroups(groupResult.value);
      }

      if (eventResult.status === 'fulfilled') {
        setEvents(eventResult.value);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-14">
      <ClientHero />

      {/* EXPERIENCIAS */}
      <section>
        <RevealOnScroll>
          <div className="mb-7">
            <h2 className="text-3xl font-black text-red-950">
              Hagamos que esta Navidad sea especial
            </h2>

            <p className="mt-2 text-slate-500">
              Cada celebración comienza con las personas que la hacen única.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = section.icon;

            return (
              <RevealOnScroll key={section.title} delay={index * 100}>
                <Link
                  to={section.path}
                  className="group block h-full cursor-pointer overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 overflow-hidden bg-red-100">
                    <img
                      src={section.image}
                      alt={section.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 to-transparent" />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-red-700">
                      <Icon size={19} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        ChristmasCards
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-red-950">
                      {section.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {section.description}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-700">
                      {section.action}
                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* GRUPOS REALES */}
      {groups.length > 0 && (
        <RevealOnScroll>
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-red-950">
                  Tus amigos te esperan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Entra a tus grupos y conoce las novedades.
                </p>
              </div>

              <Link
                to="/home/my-space"
                className="cursor-pointer font-bold text-red-700 hover:underline"
              >
                Ver todos los grupos
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {groups.slice(0, 2).map((group) => (
                <Link
                  key={group.id}
                  to={`/home/groups/${group.id}`}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:shadow-lg"
                >
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-24 w-24 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700">
                      <Users size={35} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black text-red-950">
                      {group.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {group.description || 'Un grupo para compartir.'}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-red-700">
                      Entrar al grupo
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* EVENTOS REALES */}
      {events.length > 0 && (
        <RevealOnScroll>
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-red-950">
                  Celebraciones compartidas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tus próximos intercambios de regalos.
                </p>
              </div>

              <Link
                to="/home/events"
                className="cursor-pointer font-bold text-red-700 hover:underline"
              >
                Ver eventos
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {events.slice(0, 2).map((event) => (
                <Link
                  key={event.id}
                  to="/home/events"
                  className="group overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 p-5">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid h-24 w-24 place-items-center rounded-xl bg-red-100 text-red-700">
                        <Gift size={36} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-red-950">
                        {event.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {event.status === 'draft'
                          ? 'Preparando el sorteo'
                          : event.status === 'drawn'
                            ? 'Ya puedes descubrir tu regalo'
                            : 'Consultar evento'}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-red-700">
                        Ver celebración <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* CATÁLOGO DE CARTAS */}
      <RevealOnScroll>
        <section className="space-y-6">
          <ClientCards limit={3} showCreate={false} />

          <div className="text-center">
            <Link
              to="/home/cards"
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-6 py-3 font-bold text-red-700 transition hover:bg-red-50"
            >
              Explorar todas las tarjetas
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {/* CIERRE NAVIDEÑO */}
      <RevealOnScroll>
        <section className="relative overflow-hidden rounded-3xl bg-red-950 text-white">
          <img
            src={photos.ornaments}
            alt="Decoraciones y regalos navideños"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-950/85 to-red-900/50" />

          <div className="relative max-w-2xl px-7 py-14 sm:px-12">
            <h2 className="text-3xl font-black sm:text-4xl">
              Los mejores recuerdos se crean juntos
            </h2>

            <p className="mt-4 leading-8 text-red-100">
              Invita a alguien especial y comienza una nueva
              tradición con ChristmasCards.
            </p>

            <Link
              to="/home/my-space"
              className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-red-800 transition hover:bg-red-50"
            >
              Reunir a mis amigos
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
