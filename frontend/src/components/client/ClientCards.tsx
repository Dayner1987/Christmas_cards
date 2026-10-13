
 // src/components/client/ClientCards.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { FormEvent } from 'react';

import { Link } from 'react-router-dom';

import {
  Gift,
  ImagePlus,
  Inbox,
  Plus,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import {
  createCard,
  getPublicCards,
  uploadCardImage,
} from '../../api/cards';

import {
  createUserCard,
  sendUserCard,
} from '../../api/user_cards';

import { getMyGroups } from '../../api/groups';
import { getGroupMembers } from '../../api/group-members';
import { getApiError } from '../../api/http';
import { useAuth } from '../../hooks/auth.hooks';

import type {
  Card,
  CardCategory,
} from '../../types/cards.schema';

import type { Group } from '../../types/group.schema';

import type {
  GroupMember,
} from '../../types/group_members.schema';

interface ClientCardsProps {
  limit?: number;
  showCreate?: boolean;
}

const categories: Record<CardCategory, string> = {
  christmas: 'Navidad',
  new_year: 'Año Nuevo',
  secret_santa: 'Amigo Secreto',
  custom: 'Personalizada',
};

const defaultMessage =
  '¡Te deseo una Navidad llena de alegría y buenos momentos!';

export default function ClientCards({
  limit,
  showCreate = true,
}: ClientCardsProps) {
  const { user } = useAuth();

  // =====================================================
  // CATÁLOGO DE TARJETAS
  // =====================================================

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [categoryFilter, setCategoryFilter] =
    useState<'all' | CardCategory>('all');

  // =====================================================
  // CREACIÓN DE TARJETAS
  // =====================================================

  const [openCreate, setOpenCreate] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [category, setCategory] =
    useState<CardCategory>('christmas');

  const [file, setFile] = useState<File | null>(null);

  // =====================================================
  // ENVÍO DE TARJETAS
  // =====================================================

  const [selectedCard, setSelectedCard] =
    useState<Card | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);

  const [groupId, setGroupId] = useState('');

  const [members, setMembers] =
    useState<GroupMember[]>([]);

  const [recipientId, setRecipientId] = useState('');

  const [friendSearch, setFriendSearch] = useState('');

  const [message, setMessage] = useState(defaultMessage);

  const [groupsLoading, setGroupsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const membersRequestRef = useRef(0);

  // =====================================================
  // ESTADOS GENERALES
  // =====================================================

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');

  // =====================================================
  // OBTENER TARJETAS PÚBLICAS
  // =====================================================

  const loadCards = async () => {
    const data = await getPublicCards();
    setCards(data);
  };

  useEffect(() => {
    let active = true;

    getPublicCards()
      .then((data) => {
        if (active) {
          setCards(data);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(getApiError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // =====================================================
  // BUSCADOR Y FILTROS DE TARJETAS
  // =====================================================

  const visibleCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = cards.filter((card) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        card.category === categoryFilter;

      const text = [
        card.name,
        card.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesCategory &&
        (!query || text.includes(query))
      );
    });

    return limit
      ? filtered.slice(0, limit)
      : filtered;
  }, [cards, search, categoryFilter, limit]);

  // =====================================================
  // MIEMBROS REGISTRADOS DISPONIBLES
  // =====================================================

  const registeredMembers = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();

    return members.filter((member) => {
      if (member.membershipStatus !== 'active') {
        return false;
      }

      if (member.isGuest || !member.user?.id) {
        return false;
      }

      // No permitimos enviarse tarjetas a uno mismo.
      if (member.user.id === user?.id) {
        return false;
      }

      const text = [
        member.user.firstName,
        member.user.lastName,
        member.user.username,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !query || text.includes(query);
    });
  }, [members, friendSearch, user?.id]);

  // =====================================================
  // INVITADOS SIN CUENTA
  // =====================================================

  const guestMembers = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();

    return members.filter((member) => {
      if (member.membershipStatus !== 'active') {
        return false;
      }

      if (!member.isGuest) {
        return false;
      }

      const name = (member.guestName || '')
        .toLowerCase();

      return !query || name.includes(query);
    });
  }, [members, friendSearch]);

  const otherRegisteredCount = members.filter(
    (member) =>
      member.membershipStatus === 'active' &&
      !member.isGuest &&
      Boolean(member.user?.id) &&
      member.user?.id !== user?.id,
  ).length;

  // =====================================================
  // LIMPIAR FORMULARIO DE CREACIÓN
  // =====================================================

  const resetCreateForm = () => {
    setOpenCreate(false);
    setName('');
    setDescription('');
    setCategory('christmas');
    setFile(null);
  };

  // =====================================================
  // CREAR TARJETA PÚBLICA
  // =====================================================

  const createNewCard = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (busy || !name.trim()) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      const created = await createCard({
        name: name.trim(),
        description: description.trim(),
        category,
        isPublic: true,
      });

      let imageError = '';

      if (file) {
        try {
          await uploadCardImage(
            created.id,
            'preview',
            file,
          );
        } catch (cause) {
          imageError = getApiError(cause);
        }
      }

      resetCreateForm();

      if (imageError) {
        setError(
          `Tarjeta creada, pero no se pudo subir su imagen: ${imageError}`,
        );
      } else {
        setNotice(
          '¡Tu tarjeta está disponible para todos!',
        );
      }

      try {
        await loadCards();
      } catch (cause) {
        setError(
          `La tarjeta se guardó, pero no se pudo actualizar el catálogo: ${getApiError(cause)}`,
        );
      }
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // CARGAR INTEGRANTES DE UN GRUPO
  // =====================================================

  const selectGroup = async (id: string) => {
    const requestId = ++membersRequestRef.current;

    setGroupId(id);
    setMembers([]);
    setRecipientId('');
    setFriendSearch('');
    setModalError('');

    if (!id) {
      setMembersLoading(false);
      return;
    }

    setMembersLoading(true);

    try {
      const data = await getGroupMembers(id);

      if (requestId === membersRequestRef.current) {
        setMembers(data);
      }
    } catch (cause) {
      if (requestId === membersRequestRef.current) {
        setModalError(getApiError(cause));
      }
    } finally {
      if (requestId === membersRequestRef.current) {
        setMembersLoading(false);
      }
    }
  };

  // =====================================================
  // ABRIR MODAL DE ENVÍO
  // =====================================================

  const openSend = async (card: Card) => {
    membersRequestRef.current += 1;

    setSelectedCard(card);
    setGroups([]);
    setGroupId('');
    setMembers([]);
    setRecipientId('');
    setFriendSearch('');
    setMessage(defaultMessage);
    setModalError('');
    setNotice('');

    setGroupsLoading(true);

    try {
      const myGroups = await getMyGroups();

      setGroups(myGroups);

      // Seleccionar automáticamente si solo hay un grupo.
      if (myGroups.length === 1) {
        await selectGroup(myGroups[0].id);
      }
    } catch (cause) {
      setModalError(getApiError(cause));
    } finally {
      setGroupsLoading(false);
    }
  };

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  const closeSend = () => {
    if (busy) return;

    membersRequestRef.current += 1;

    setSelectedCard(null);
    setGroups([]);
    setGroupId('');
    setMembers([]);
    setRecipientId('');
    setFriendSearch('');
    setModalError('');
    setMembersLoading(false);
  };

  // =====================================================
  // ENVIAR TARJETA
  // =====================================================

  const sendCard = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      busy ||
      !selectedCard ||
      !groupId ||
      !recipientId ||
      !message.trim()
    ) {
      return;
    }

    setBusy(true);
    setModalError('');
    setNotice('');

    let draftId: string | null = null;

    try {
      const created = await createUserCard({
        cardId: selectedCard.id,
        recipientId,
        groupId,
        title: selectedCard.name,
        message: message.trim(),
        deliveryChannel: 'application',
      });

      draftId = created.id;

      await sendUserCard(created.id);

      setNotice(
        '¡Tarjeta enviada correctamente! Tu amigo podrá verla en su buzón.',
      );

      closeSend();

      // closeSend bloquea el cierre mientras busy
      // está activo; cerramos explícitamente tras éxito.
      setSelectedCard(null);
      setGroupId('');
      setRecipientId('');
    } catch (cause) {
      setModalError(
        draftId
          ? `La tarjeta se guardó como borrador, pero no se pudo enviar: ${getApiError(cause)}`
          : getApiError(cause),
      );
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <section className="space-y-6">

      {/* ENCABEZADO */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
            <Gift className="text-red-600" />
            Tarjetas para compartir
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Elige una tarjeta y sorprende a alguien especial.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Link
            to="/home/mailbox"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            <Inbox size={18} />
            Mi buzón
          </Link>

          {showCreate && (
            <button
              type="button"
              onClick={() => setOpenCreate((value) => !value)}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800"
            >
              <Plus size={18} />
              {openCreate ? 'Cerrar formulario' : 'Crear tarjeta'}
            </button>
          )}

        </div>
      </div>

      {/* MENSAJES */}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {/* ================================================= */}
      {/* BUSCADOR Y FILTROS */}
      {/* ================================================= */}

      {!limit && (
        <div className="grid gap-3 rounded-2xl border border-red-100 bg-white p-4 md:grid-cols-[1fr_220px]">

          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar tarjetas..."
              className="min-h-12 w-full rounded-xl border border-red-200 pl-12 pr-4 outline-none focus:border-red-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value as 'all' | CardCategory,
              )
            }
            className="min-h-12 cursor-pointer rounded-xl border border-red-200 bg-white px-4 outline-none focus:border-red-500"
          >
            <option value="all">
              Todas las ocasiones
            </option>

            {Object.entries(categories).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>

        </div>
      )}

      {/* ================================================= */}
      {/* FORMULARIO DE CREAR TARJETA */}
      {/* ================================================= */}

      {openCreate && (
        <form
          onSubmit={(event) => void createNewCard(event)}
          className="grid gap-4 rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h3 className="text-xl font-black text-red-950 sm:col-span-2">
            Crear una tarjeta navideña
          </h3>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la tarjeta"
            maxLength={150}
            required
            className="min-h-12 rounded-xl border border-red-200 px-4 outline-none focus:border-red-500"
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CardCategory)
            }
            className="min-h-12 cursor-pointer rounded-xl border border-red-200 bg-white px-4"
          >
            {Object.entries(categories).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Descripción de tu tarjeta"
            rows={3}
            maxLength={500}
            className="rounded-xl border border-red-200 p-4 outline-none focus:border-red-500 sm:col-span-2"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 p-5 text-sm font-semibold text-red-700 sm:col-span-2">
            <ImagePlus size={22} />

            <span className="truncate">
              {file
                ? file.name
                : 'Seleccionar imagen JPG, PNG o WEBP'}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={resetCreateForm}
              disabled={busy}
              className="min-h-11 cursor-pointer rounded-xl border border-red-200 px-5 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="min-h-11 cursor-pointer rounded-xl bg-red-700 px-6 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? 'Publicando...'
                : 'Publicar tarjeta'}
            </button>
          </div>
        </form>
      )}

      {/* ================================================= */}
      {/* CATÁLOGO DE TARJETAS */}
      {/* ================================================= */}

      {loading ? (
        <p className="rounded-2xl bg-white p-7 text-slate-500">
          Cargando tarjetas...
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {visibleCards.map((card) => {
            const image =
              card.previewImageUrl ||
              card.frontImageUrl ||
              card.backgroundImageUrl;

            return (
              <article
                key={card.id}
                className="group overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 to-rose-500 text-white">
                  {image ? (
                    <img
                      src={image}
                      alt={card.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Gift size={62} strokeWidth={1.4} />
                  )}
                </div>

                <div className="p-5">
                  <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                    {categories[card.category] || 'Tarjeta'}
                  </span>

                  <h3 className="mt-2 text-xl font-black text-red-950">
                    {card.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {card.description ||
                      'Una tarjeta para compartir buenos momentos.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => void openSend(card)}
                    className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-4 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98]"
                  >
                    <Send size={18} />
                    Enviar tarjeta
                  </button>
                </div>
              </article>
            );
          })}

          {visibleCards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-red-200 bg-white p-8 text-sm text-slate-500 sm:col-span-2">
              No encontramos tarjetas para mostrar.
            </div>
          )}

        </div>
      )}

      {/* ================================================= */}
      {/* MODAL PARA ENVIAR TARJETA */}
      {/* ================================================= */}

      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enviar tarjeta"
          className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/70 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={(event) => void sendCard(event)}
            className="relative max-h-[92vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >

            {/* CERRAR */}
            <button
              type="button"
              onClick={closeSend}
              disabled={busy}
              aria-label="Cerrar"
              className="absolute right-5 top-5 cursor-pointer rounded-lg p-2 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              <X size={21} />
            </button>

            <h3 className="pr-10 text-2xl font-black text-red-950">
              Enviar una sorpresa
            </h3>

            <p className="text-sm text-slate-500">
              Tarjeta seleccionada:{' '}
              <strong>{selectedCard.name}</strong>
            </p>

            {modalError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {modalError}
              </p>
            )}

            {/* ELEGIR GRUPO */}
            <label className="block text-sm font-bold text-red-950">
              Selecciona un grupo

              <select
                value={groupId}
                onChange={(event) =>
                  void selectGroup(event.target.value)
                }
                disabled={busy || groupsLoading}
                className="mt-2 min-h-12 w-full cursor-pointer rounded-xl border border-red-200 bg-white px-4 outline-none focus:border-red-500 disabled:opacity-50"
              >
                <option value="">
                  {groupsLoading
                    ? 'Cargando grupos...'
                    : 'Seleccionar grupo'}
                </option>

                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            {!groupsLoading && groups.length === 0 && (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-slate-600">
                Todavía no perteneces a ningún grupo.
                Crea uno o únete a tus amigos para enviarles
                tarjetas.
              </p>
            )}

            {/* LISTA DE INTEGRANTES */}
            {groupId && (
              <div className="space-y-4">

                <div>
                  <h4 className="flex items-center gap-2 font-black text-red-950">
                    <Users size={19} className="text-red-600" />
                    ¿A quién deseas enviarla?
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Selecciona a un integrante registrado
                    en ChristmasCards.
                  </p>
                </div>

                {/* BUSCADOR DE AMIGOS */}
                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500"
                  />

                  <input
                    type="search"
                    value={friendSearch}
                    onChange={(event) =>
                      setFriendSearch(event.target.value)
                    }
                    placeholder="Buscar por nombre o usuario..."
                    className="min-h-12 w-full rounded-xl border border-red-200 pl-12 pr-4 outline-none focus:border-red-500"
                  />
                </div>

                {membersLoading ? (
                  <p className="rounded-xl bg-red-50 p-4 text-sm text-slate-500">
                    Cargando participantes...
                  </p>
                ) : (
                  <>
                    {/* REGISTRADOS */}
                    {registeredMembers.length > 0 && (
                      <div className="max-h-56 space-y-2 overflow-y-auto">

                        {registeredMembers.map((member) => {
                          const person = member.user!;

                          const displayName = [
                            person.firstName,
                            person.lastName,
                          ]
                            .filter(Boolean)
                            .join(' ')
                            .trim() || person.username;

                          return (
                            <label
                              key={member.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                                recipientId === person.id
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-red-100 hover:border-red-300 hover:bg-red-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="recipient"
                                checked={recipientId === person.id}
                                onChange={() =>
                                  setRecipientId(person.id)
                                }
                                className="accent-red-700"
                              />

                              {person.avatarUrl ? (
                                <img
                                  src={person.avatarUrl}
                                  alt={displayName}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-700">
                                  <UserRound size={22} />
                                </span>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-red-950">
                                  {displayName}
                                </p>

                                <p className="text-xs text-slate-500">
                                  @{person.username}
                                </p>
                              </div>
                            </label>
                          );
                        })}

                      </div>
                    )}

                    {/* SIN USUARIOS REGISTRADOS */}
                    {registeredMembers.length === 0 && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                        <p className="text-sm font-semibold text-red-900">
                          {friendSearch.trim()
                            ? 'No encontramos cuentas registradas con ese nombre.'
                            : otherRegisteredCount === 0
                              ? 'Todavía no hay otros usuarios registrados en este grupo.'
                              : 'No encontramos un destinatario disponible.'}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          Puedes enviar tarjetas a otros
                          integrantes cuando tengan una
                          cuenta de ChristmasCards.
                        </p>

                      </div>
                    )}

                    {/* INVITADOS SIN CUENTA */}
                    {guestMembers.length > 0 && (
                      <div className="space-y-3">

                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Invitados del grupo
                        </p>

                        {guestMembers.map((guest) => {
                          const guestName =
                            guest.guestName || 'Invitado';

                          return (
                            <div
                              key={guest.id}
                              className="flex items-center gap-3 rounded-xl border border-red-100 bg-white p-3"
                            >
                              {guest.guestAvatarUrl ? (
                                <img
                                  src={guest.guestAvatarUrl}
                                  alt={guestName}
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-red-100 font-black text-red-700">
                                  {guestName.charAt(0).toUpperCase()}
                                </span>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-red-950">
                                  {guestName}
                                </p>

                                <p className="text-xs text-slate-500">
                                  Invitado sin cuenta
                                </p>
                              </div>

                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                No disponible
                              </span>
                            </div>
                          );
                        })}

                        <p className="text-xs leading-5 text-slate-500">
                          Los invitados pueden participar
                          en Amigo Secreto. Cuando creen
                          su cuenta, también podrán recibir
                          tarjetas en su buzón.
                        </p>

                      </div>
                    )}

                  </>
                )}
              </div>
            )}

            {/* MENSAJE */}
            <label className="block text-sm font-bold text-red-950">
              Tu mensaje

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={4}
                maxLength={2000}
                required
                placeholder="Escribe unas palabras especiales..."
                className="mt-2 w-full rounded-xl border border-red-200 p-4 outline-none focus:border-red-500"
              />
            </label>

            {/* ACCIONES */}
            <div className="flex flex-wrap gap-3 border-t border-red-100 pt-5">

              <button
                type="button"
                onClick={closeSend}
                disabled={busy}
                className="min-h-12 cursor-pointer rounded-xl border border-red-200 px-5 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  busy ||
                  membersLoading ||
                  !selectedCard ||
                  !groupId ||
                  !recipientId ||
                  !message.trim()
                }
                className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Send size={18} />
                {busy ? 'Enviando...' : 'Enviar tarjeta'}
              </button>

            </div>

          </form>
        </div>
      )}

    </section>
  );
}
