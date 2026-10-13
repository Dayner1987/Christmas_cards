
 // src/pages/client/ClientEventsPage.tsx

import { CalendarHeart, Gift } from 'lucide-react';

import ClientEvents from '../../components/client/ClientEvents';
import RevealOnScroll from '../../components/client/RevealOnScroll';

export default function ClientEventsPage() {
  return (
    <div className="space-y-8">

      {/* ENCABEZADO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-red-800 to-rose-600 px-7 py-10 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider">
            <CalendarHeart size={17} />
            Momentos especiales
          </span>

          <h1 className="mt-5 text-4xl font-black sm:text-5xl">
            Mis eventos
          </h1>

          <p className="mt-4 text-base leading-7 text-red-100">
            Organiza intercambios de regalos, reúne a tus
            amigos y descubre a quién le darás una sorpresa
            en esta Navidad.
          </p>
        </div>

        <Gift
          size={145}
          strokeWidth={1}
          className="pointer-events-none absolute bottom-0 right-8 hidden text-white/15 md:block"
        />
      </section>

      {/* EVENTOS */}
      <RevealOnScroll>
        <ClientEvents />
      </RevealOnScroll>

    </div>
  );
}
