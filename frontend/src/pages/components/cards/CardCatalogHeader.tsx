import {
  Gift,
  Sparkles,
} from 'lucide-react';

interface CardCatalogHeaderProps {
  total: number;
}

export default function CardCatalogHeader({
  total,
}: CardCatalogHeaderProps) {
  return (
    <>
      {/* Banner */}

      <section className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-red-700 to-amber-800 px-6 py-10 shadow-lg sm:px-10">
        {/* Decoraciones */}

        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-300/20 blur-3xl" />

        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-red-300/20 blur-3xl" />

        <div className="relative z-10 max-w-xl">
          <div className="mb-3 flex items-center gap-2 text-yellow-200">
            <Gift size={20} />

            <span className="text-sm font-bold uppercase tracking-widest">
              ChristmasCards
            </span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
            Tarjetas que hacen
            <br />
            más especial la Navidad
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-100 sm:text-base">
            Comparte emoción, esperanza y
            buenos deseos.
          </p>
        </div>

        <div className="absolute bottom-5 right-8 hidden rotate-3 rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:block">
          <Sparkles className="text-yellow-200" />

          <p className="mt-2 max-w-[150px] text-sm font-bold text-white">
            La magia está en compartir
          </p>
        </div>
      </section>

      {/* Título */}

      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">
          {total} tarjetas disponibles
        </p>

        <h2 className="mt-1 text-2xl font-black text-slate-900">
          Todas las tarjetas
        </h2>
      </div>
    </>
  );
}