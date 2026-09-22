import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronDown,
  Search,
} from 'lucide-react';

import {
  useCards,
} from '../../../hooks/cards.hook';

import type {
  CardCategory,
} from '../../../types/cards.schema';

import CardItem from './CardItem';

import CardFilters from './CardFilters';

import CardCatalogHeader from './CardCatalogHeader';

type SortOption =
  | 'popular'
  | 'newest'
  | 'name';

export default function CardCatalogPage() {
  const {
    cards,
    loading,
    error,
    fetchCards,
  } = useCards();

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<
    CardCategory | 'all'
  >('all');

  const [
    onlyPublic,
    setOnlyPublic,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    sort,
    setSort,
  ] = useState<SortOption>(
    'popular',
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards =
    useMemo(() => {
      let result = [...cards];

      // Categoría

      if (
        selectedCategory !==
        'all'
      ) {
        result = result.filter(
          (card) =>
            card.category ===
            selectedCategory,
        );
      }

      // Públicas

      if (onlyPublic) {
        result = result.filter(
          (card) =>
            card.isPublic,
        );
      }

      // Buscar

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (normalizedSearch) {
        result =
          result.filter(
            (card) =>
              card.name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              card.description
                ?.toLowerCase()
                .includes(
                  normalizedSearch,
                ),
          );
      }

      // Orden

      if (sort === 'newest') {
        result.sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        );
      }

      if (sort === 'name') {
        result.sort((a, b) =>
          a.name.localeCompare(
            b.name,
          ),
        );
      }

      return result;
    }, [
      cards,
      selectedCategory,
      onlyPublic,
      search,
      sort,
    ]);

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}

        <CardCatalogHeader
          total={filteredCards.length}
        />

        {/* Barra de búsqueda */}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar tarjetas..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target
                    .value as SortOption,
                )
              }
              className="h-11 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-purple-500"
            >
              <option value="popular">
                Más populares
              </option>

              <option value="newest">
                Más recientes
              </option>

              <option value="name">
                Nombre
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {/* Contenido */}

        <div className="flex gap-7">
          <CardFilters
            selectedCategory={
              selectedCategory
            }
            onCategoryChange={
              setSelectedCategory
            }
            onlyPublic={onlyPublic}
            onPublicChange={
              setOnlyPublic
            }
          />

          {/* Grid */}

          <section className="min-w-0 flex-1">

            {loading && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="animate-pulse overflow-hidden rounded-2xl bg-white"
                    >
                      <div className="aspect-[4/3] bg-slate-200" />

                      <div className="space-y-3 p-4">
                        <div className="h-4 rounded bg-slate-200" />

                        <div className="h-3 w-2/3 rounded bg-slate-200" />

                        <div className="h-10 rounded-xl bg-slate-200" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-semibold text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={fetchCards}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredCards.length ===
                0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <p className="text-lg font-bold text-slate-800">
                    No encontramos
                    tarjetas.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Prueba con otra
                    búsqueda o categoría.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              filteredCards.length >
                0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {filteredCards.map(
                    (card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                      />
                    ),
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}