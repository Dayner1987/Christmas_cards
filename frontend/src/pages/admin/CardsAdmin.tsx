import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FormEvent,
  ReactNode,
} from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Eye,
  Gift,
  Globe,
  ImageIcon,
  Layers,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TreePine,
  X,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';
import { useCards } from '../../hooks/cards.hook';
import { authStorage } from '../../config/auth.storage';
import type {
  Card,
  CardCategory,
  CreateCard,
} from '../../types/cards.schema';

type CategoryFilter = 'all' | CardCategory;
type CatalogScope = 'mine' | 'public';
type ModalMode = 'create' | 'edit' | 'preview' | 'delete';

interface CardForm {
  name: string;
  description: string;
  frontImageUrl: string;
  backgroundImageUrl: string;
  previewImageUrl: string;
  category: CardCategory;
  isPublic: boolean;
}

const categories = [
  {
    value: 'all',
    label: 'Todas',
    icon: Layers,
  },
  {
    value: 'christmas',
    label: 'Navidad',
    icon: TreePine,
  },
  {
    value: 'new_year',
    label: 'Año Nuevo',
    icon: Sparkles,
  },
  {
    value: 'secret_santa',
    label: 'Amigo secreto',
    icon: Gift,
  },
  {
    value: 'custom',
    label: 'Personalizadas',
    icon: Pencil,
  },
] as const;

const categoryNames: Record<CardCategory, string> = {
  christmas: 'Navidad',
  new_year: 'Año Nuevo',
  secret_santa: 'Amigo secreto',
  custom: 'Personalizada',
};

const emptyForm: CardForm = {
  name: '',
  description: '',
  frontImageUrl: '',
  backgroundImageUrl: '',
  previewImageUrl: '',
  category: 'christmas',
  isPublic: false,
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join('. ');
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (!error.response) {
      return 'No se pudo conectar con el servidor.';
    }
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error. Intenta nuevamente.';
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CardImage({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || failedSource === src) {
    return (
      <div className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-3 bg-violet-50 p-6 text-violet-400">
        <ImageIcon className="h-10 w-10" />
        <span className="text-center text-sm">
          Imagen no disponible
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSource(src)}
      className="h-full w-full object-contain"
    />
  );
}

function Modal({
  title,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = 'hidden';

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onClose();
        }
      }}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm ${
        wide ? 'max-w-4xl' : 'max-w-lg'
      }`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-violet-100 bg-white px-5 py-4 sm:px-6">
        <h2
          id={titleId}
          className="text-lg font-bold text-slate-900"
        >
          {title}
        </h2>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="rounded-xl p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </dialog>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="break-words">{message}</p>
    </div>
  );
}

function CardsContent({ currentUserId }: { currentUserId: string }) {
  const {
    myCards,
    publicCards,
    loading,
    fetchMyCards,
    fetchPublicCards,
    createCard,
    updateCard,
    deleteCard,
  } = useCards();

  const [scope, setScope] = useState<CatalogScope>('mine');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [form, setForm] = useState<CardForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    void Promise.allSettled([
      fetchMyCards(),
      fetchPublicCards(),
    ]).then((results) => {
      if (!active) return;

      const failures = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [
              `${
                index === 0 ? 'Mis tarjetas' : 'Catálogo público'
              }: ${getErrorMessage(result.reason)}`,
            ]
          : [],
      );

      setListError(failures.join(' '));
    });

    return () => {
      active = false;
    };
  }, [fetchMyCards, fetchPublicCards]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice('');
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const catalog = scope === 'mine' ? myCards : publicCards;

  const filteredCards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');

    return catalog
      .filter((card) => {
        const matchesCategory =
          category === 'all' || card.category === category;

        const searchableText =
          `${card.name} ${card.description ?? ''}`.toLocaleLowerCase('es');

        return matchesCategory && searchableText.includes(query);
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  }, [catalog, category, search]);

  const stats = [
    {
      label: 'Mis tarjetas',
      value: myCards.length,
      icon: Layers,
    },
    {
      label: 'Mis tarjetas públicas',
      value: myCards.filter((card) => card.isPublic).length,
      icon: Globe,
    },
    {
      label: 'Mis tarjetas privadas',
      value: myCards.filter((card) => !card.isPublic).length,
      icon: Lock,
    },
  ];

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedCard(null);
    setModalError('');
  };

  const openCreate = () => {
    setSelectedCard(null);
    setModalError('');
    setForm({
      ...emptyForm,
      category: category === 'all' ? 'christmas' : category,
    });
    setModal('create');
  };

  const openCard = (
    mode: Exclude<ModalMode, 'create'>,
    card: Card,
  ) => {
    setSelectedCard(card);
    setModalError('');

    if (mode === 'edit') {
      setForm({
        name: card.name,
        description: card.description ?? '',
        frontImageUrl: card.frontImageUrl,
        backgroundImageUrl: card.backgroundImageUrl ?? '',
        previewImageUrl: card.previewImageUrl ?? '',
        category: card.category,
        isPublic: card.isPublic,
      });
    }

    setModal(mode);
  };

  const refreshCatalogs = async (): Promise<boolean> => {
    setListError('');

    const results = await Promise.allSettled([
      fetchMyCards(),
      fetchPublicCards(),
    ]);

    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [
            `${
              index === 0 ? 'Mis tarjetas' : 'Catálogo público'
            }: ${getErrorMessage(result.reason)}`,
          ]
        : [],
    );

    setListError(failures.join(' '));
    return failures.length === 0;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving || loading) return;

    setModalError('');

    const name = form.name.trim();
    const frontImageUrl = form.frontImageUrl.trim();
    const backgroundImageUrl = form.backgroundImageUrl.trim();
    const previewImageUrl = form.previewImageUrl.trim();

    if (!name) {
      setModalError('Escribe el nombre de la tarjeta.');
      return;
    }

    if (
      !isHttpUrl(frontImageUrl) ||
      (backgroundImageUrl && !isHttpUrl(backgroundImageUrl)) ||
      (previewImageUrl && !isHttpUrl(previewImageUrl))
    ) {
      setModalError('Las imágenes deben usar una URL válida con http o https.');
      return;
    }

    // El contrato actual no admite null para quitar imágenes existentes.
    if (
      modal === 'edit' &&
      selectedCard &&
      (
        (selectedCard.backgroundImageUrl && !backgroundImageUrl) ||
        (selectedCard.previewImageUrl && !previewImageUrl)
      )
    ) {
      setModalError(
        'Puedes reemplazar las imágenes opcionales. Para quitarlas, el backend y UpdateCard deben admitir null.',
      );
      return;
    }

    const payload: CreateCard = {
      name,
      description: form.description.trim(),
      frontImageUrl,
      category: form.category,
      isPublic: form.isPublic,
      ...(backgroundImageUrl ? { backgroundImageUrl } : {}),
      ...(previewImageUrl ? { previewImageUrl } : {}),
    };

    setSaving(true);

    try {
      if (modal === 'edit' && selectedCard) {
        await updateCard(selectedCard.id, payload);
        setNotice('Tarjeta actualizada correctamente.');
      } else if (modal === 'create') {
        await createCard(payload);
        setScope('mine');
        setCategory('all');
        setSearch('');
        setNotice('Tarjeta creada correctamente.');
      } else {
        return;
      }

      setModal(null);
      setSelectedCard(null);

      // También actualiza el catálogo si cambia la visibilidad.
      await refreshCatalogs();
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCard || saving || loading) return;

    setSaving(true);
    setModalError('');

    try {
      await deleteCard(selectedCard.id);
      setModal(null);
      setSelectedCard(null);
      setNotice('Tarjeta eliminada correctamente.');
      await refreshCatalogs();
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    modal === 'create'
      ? 'Crear tarjeta'
      : modal === 'edit'
        ? 'Editar tarjeta'
        : modal === 'delete'
          ? 'Eliminar tarjeta'
          : 'Vista previa';

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Administración
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tarjetas
          </h1>

          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Crea diseños para cada ocasión y organiza tus tarjetas por categoría.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={loading || saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Nueva tarjeta
        </button>
      </header>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <Check className="h-5 w-5 shrink-0" />
          {notice}
        </div>
      )}

      {listError && <ErrorNotice message={listError} />}

      <section
        aria-label="Resumen de tarjetas"
        className="grid gap-3 sm:grid-cols-3"
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-white p-5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Icon className="h-6 w-6" />
            </span>

            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-5 rounded-3xl border border-violet-100 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Seleccionar catálogo"
            className="flex rounded-2xl bg-slate-100 p-1"
          >
            {[
              { value: 'mine', label: 'Mis tarjetas' },
              { value: 'public', label: 'Catálogo público' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={scope === tab.value}
                onClick={() => setScope(tab.value as CatalogScope)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  scope === tab.value
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-violet-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 gap-2 lg:w-96">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tarjetas..."
                aria-label="Buscar por nombre o descripción"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <button
              type="button"
              onClick={() => void refreshCatalogs()}
              disabled={loading || saving}
              aria-label="Actualizar tarjetas"
              title="Actualizar tarjetas"
              className="rounded-xl border border-violet-200 px-3 text-violet-600 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map(({ value, label, icon: Icon }) => {
            const count =
              value === 'all'
                ? catalog.length
                : catalog.filter((card) => card.category === value).length;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  category === value
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}

                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    category === value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p
            aria-live="polite"
            className="text-sm text-slate-500"
          >
            {filteredCards.length}{' '}
            {filteredCards.length === 1 ? 'tarjeta encontrada' : 'tarjetas encontradas'}
          </p>

          {(category !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setSearch('');
              }}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-violet-600 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div
          role="status"
          className="flex min-h-64 flex-col items-center justify-center gap-3 text-violet-600"
        >
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando tarjetas...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50/40 p-8 text-center">
          <span className="mb-4 rounded-2xl bg-white p-4 text-violet-500 shadow-sm">
            <ImageIcon className="h-9 w-9" />
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            No hay tarjetas para mostrar
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {search || category !== 'all'
              ? 'Prueba otra categoría o cambia tu búsqueda.'
              : scope === 'mine'
                ? 'Crea tu primera tarjeta y dale un toque especial a cada celebración.'
                : 'Las tarjetas públicas aparecerán aquí cuando estén disponibles.'}
          </p>

          {scope === 'mine' && (
            <button
              type="button"
              onClick={openCreate}
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Crear tarjeta
            </button>
          )}
        </section>
      ) : (
        <section
          aria-label="Listado de tarjetas"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filteredCards.map((card) => {
            const canManage = card.creatorId === currentUserId;

            return (
              <article
                key={card.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/60"
              >
                <button
                  type="button"
                  onClick={() => openCard('preview', card)}
                  aria-label={`Ver tarjeta ${card.name}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-violet-50/60 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-violet-500"
                >
                  <CardImage
                    src={card.previewImageUrl || card.frontImageUrl}
                    alt={card.name}
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                    {categoryNames[card.category]}
                  </span>

                  <span className="absolute bottom-3 right-3 rounded-full bg-white p-2 text-violet-600 shadow-sm transition group-hover:bg-violet-600 group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                      {card.isPublic ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {card.isPublic ? 'Pública' : 'Privada'}
                    </span>

                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        card.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {card.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <h2 className="break-words text-lg font-bold text-slate-900">
                    {card.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-500">
                    {card.description || 'Sin descripción.'}
                  </p>

                  <p className="mt-4 text-xs text-slate-400">
                    Creada el {formatDate(card.createdAt)}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-5">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => openCard('edit', card)}
                          aria-label={`Editar ${card.name}`}
                          title="Editar tarjeta"
                          className="rounded-xl border border-violet-200 p-3 text-violet-600 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => openCard('delete', card)}
                          aria-label={`Eliminar ${card.name}`}
                          title="Eliminar tarjeta"
                          className="rounded-xl border border-rose-100 p-3 text-rose-500 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => openCard('preview', card)}
                      className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modal && (
        <Modal
          title={modalTitle}
          onClose={closeModal}
          busy={saving}
          wide={modal !== 'delete'}
        >
          {(modal === 'create' || modal === 'edit') && (
            <form
              onSubmit={handleSave}
              className="space-y-6"
            >
              {modalError && <ErrorNotice message={modalError} />}

              <fieldset
                disabled={saving}
                className="grid min-w-0 gap-6 disabled:opacity-70 md:grid-cols-2"
              >
                <div className="min-w-0 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Nombre de la tarjeta *
                    </span>

                    <input
                      required
                      autoFocus
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Ej. Una Navidad especial"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Categoría *
                    </span>

                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value as CardCategory,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {categories
                        .filter((item) => item.value !== 'all')
                        .map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Descripción
                    </span>

                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Describe el diseño y la ocasión..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      URL de imagen principal *
                    </span>

                    <input
                      required
                      type="url"
                      value={form.frontImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          frontImageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      URL de imagen de fondo
                    </span>

                    <input
                      type="url"
                      value={form.backgroundImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          backgroundImageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://... (opcional)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      URL de miniatura
                    </span>

                    <input
                      type="url"
                      value={form.previewImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          previewImageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://... (opcional)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50/50">
                    <div className="flex items-center gap-2 border-b border-violet-100 px-4 py-3 text-sm font-semibold text-violet-700">
                      <Eye className="h-4 w-4" />
                      Vista previa de la portada
                    </div>

                    <div className="aspect-[4/3] p-4">
                      <CardImage
                        src={form.frontImageUrl.trim()}
                        alt={form.name || 'Vista previa de tarjeta'}
                      />
                    </div>

                    <div className="border-t border-violet-100 bg-white p-4">
                      <span className="text-xs font-semibold text-violet-600">
                        {categoryNames[form.category]}
                      </span>

                      <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
                        {form.name.trim() || 'Nombre de tu tarjeta'}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                        {form.description.trim() || 'La descripción aparecerá aquí.'}
                      </p>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isPublic: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-violet-600"
                    />

                    <span>
                      <span className="block text-sm font-bold text-violet-900">
                        Tarjeta pública
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-violet-700">
                        Permite que otros usuarios encuentren este diseño
                        en el catálogo público cuando esté activo.
                      </span>
                    </span>
                  </label>

                  <p className="px-1 text-xs leading-5 text-slate-500">
                    Pega enlaces directos a imágenes accesibles.
                    La imagen principal se utiliza como portada;
                    la miniatura es opcional.
                  </p>
                </div>
              </fieldset>

              <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}

                  {saving
                    ? 'Guardando...'
                    : modal === 'edit'
                      ? 'Guardar cambios'
                      : 'Crear tarjeta'}
                </button>
              </footer>
            </form>
          )}

          {modal === 'preview' && selectedCard && (
            <div className="space-y-6">
              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                  <CardImage
                    src={selectedCard.frontImageUrl}
                    alt={selectedCard.name}
                  />
                </div>

                <div className="min-w-0 space-y-4">
                  <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    {categoryNames[selectedCard.category]}
                  </span>

                  <h3 className="break-words text-2xl font-bold text-slate-900">
                    {selectedCard.name}
                  </h3>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
                    {selectedCard.description || 'Esta tarjeta no tiene descripción.'}
                  </p>

                  <dl className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Visibilidad</dt>
                      <dd className="font-semibold text-slate-800">
                        {selectedCard.isPublic ? 'Pública' : 'Privada'}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Estado</dt>
                      <dd className="font-semibold text-slate-800">
                        {selectedCard.isActive ? 'Activa' : 'Inactiva'}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Creación</dt>
                      <dd className="text-right font-semibold text-slate-800">
                        {formatDate(selectedCard.createdAt)}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Actualización</dt>
                      <dd className="text-right font-semibold text-slate-800">
                        {formatDate(selectedCard.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {(selectedCard.backgroundImageUrl || selectedCard.previewImageUrl) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: 'Imagen de fondo',
                      src: selectedCard.backgroundImageUrl,
                    },
                    {
                      label: 'Miniatura',
                      src: selectedCard.previewImageUrl,
                    },
                  ].map((image) =>
                    image.src ? (
                      <figure
                        key={image.label}
                        className="overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <div className="aspect-video bg-slate-50 p-3">
                          <CardImage
                            src={image.src}
                            alt={`${image.label} de ${selectedCard.name}`}
                          />
                        </div>

                        <figcaption className="px-4 py-3 text-sm font-medium text-slate-600">
                          {image.label}
                        </figcaption>
                      </figure>
                    ) : null,
                  )}
                </div>
              )}

              {selectedCard.creatorId === currentUserId && (
                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    disabled={saving || loading}
                    onClick={() => openCard('edit', selectedCard)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar tarjeta
                  </button>
                </div>
              )}
            </div>
          )}

          {modal === 'delete' && selectedCard && (
            <div className="space-y-5">
              {modalError && <ErrorNotice message={modalError} />}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <Trash2 className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ¿Eliminar esta tarjeta?
                </h3>

                <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                  Vas a eliminar{' '}
                  <strong className="text-slate-800">
                    {selectedCard.name}
                  </strong>
                  . Dejará de aparecer en los listados de tarjetas disponibles.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  autoFocus
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {saving ? 'Eliminando...' : 'Eliminar tarjeta'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}

export default function CardsAdmin() {
  const session = authStorage.getUser();

  if (!session || session.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <CardsContent currentUserId={session.id} />
      </div>
    </div>
  );
}