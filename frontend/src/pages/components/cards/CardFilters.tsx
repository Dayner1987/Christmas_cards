import {
  Check,
  SlidersHorizontal,
} from 'lucide-react';

import type {
  CardCategory,
} from '../../../types/cards.schema';

interface CardFiltersProps {
  selectedCategory:
    | CardCategory
    | 'all';

  onCategoryChange: (
    category:
      | CardCategory
      | 'all',
  ) => void;

  onlyPublic: boolean;

  onPublicChange: (
    value: boolean,
  ) => void;
}

const categories: {
  value:
    | CardCategory
    | 'all';

  label: string;
}[] = [
  {
    value: 'all',
    label: 'Todas',
  },

  {
    value: 'christmas',
    label: 'Navidad',
  },

  {
    value: 'new_year',
    label: 'Año Nuevo',
  },

  {
    value: 'secret_santa',
    label: 'Amigo secreto',
  },

  {
    value: 'custom',
    label: 'Personalizadas',
  },
];

export default function CardFilters({
  selectedCategory,
  onCategoryChange,
  onlyPublic,
  onPublicChange,
}: CardFiltersProps) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        {/* Categorías */}

        <div>
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal
              size={17}
              className="text-purple-600"
            />

            <h2 className="font-bold text-slate-800">
              Categorías
            </h2>
          </div>

          <div className="space-y-1">
            {categories.map(
              (category) => {
                const active =
                  selectedCategory ===
                  category.value;

                return (
                  <button
                    key={
                      category.value
                    }
                    type="button"
                    onClick={() =>
                      onCategoryChange(
                        category.value,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-purple-100 font-bold text-purple-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {category.label}
                    </span>

                    {active && (
                      <Check
                        size={16}
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Separador */}

        <div className="my-6 h-px bg-slate-100" />

        {/* Filtros */}

        <div>
          <h2 className="mb-4 font-bold text-slate-800">
            Filtros
          </h2>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyPublic}
              onChange={(event) =>
                onPublicChange(
                  event.target.checked,
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />

            Solo públicas
          </label>
        </div>
      </div>
    </aside>
  );
}