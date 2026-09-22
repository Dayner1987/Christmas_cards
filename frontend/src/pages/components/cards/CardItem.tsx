import {
  Heart,
  Eye,
} from 'lucide-react';

import type {
  Card,
} from '../../../types/cards.schema';

interface CardItemProps {
  card: Card;
}

const categoryLabels: Record<
  Card['category'],
  string
> = {
  christmas: 'Navidad',
  new_year: 'Año Nuevo',
  secret_santa: 'Amigo secreto',
  custom: 'Personalizada',
};

export default function CardItem({
  card,
}: CardItemProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen */}

      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={
            card.previewImageUrl ??
            card.frontImageUrl
          }
          alt={card.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Categoría */}

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
            {categoryLabels[card.category]}
          </span>
        </div>

        {/* Favorito */}

        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-red-500"
          aria-label={`Agregar ${card.name} a favoritos`}
        >
          <Heart
            size={17}
          />
        </button>
      </div>

      {/* Información */}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-800">
              {card.name}
            </h3>

            {card.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {card.description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700"
        >
          <Eye size={16} />

          Ver tarjeta
        </button>
      </div>
    </article>
  );
}