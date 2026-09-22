import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  ChevronDown,
  Gift,
  LoaderCircle,
  LogOut,
  Pencil,
} from 'lucide-react';

import { authStorage } from '../../../config/auth.storage';

import type { User } from '../../../types/user.schema';

type NavbarUser =
  NonNullable<ReturnType<typeof authStorage.getUser>> &
  Partial<
    Pick<
      User,
      'firstName' | 'lastName' | 'avatarUrl' | 'role'
    >
  >;

interface MobileNavbarProps {
  homePath?: string;
  editProfilePath?: string;
  loginPath?: string;
  onLogout?: () => void | Promise<void>;
}

export default function MobileNavbar({
  homePath = '/admin',
  editProfilePath = '/admin/perfil/editar',
  loginPath = '/login',
  onLogout,
}: MobileNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelId = useId();

  const [user, setUser] = useState<NavbarUser | null>(
    () => authStorage.getUser(),
  );

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [failedAvatar, setFailedAvatar] =
    useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutPending = useRef(false);

  useEffect(() => {
    const refreshUser = () => {
      setUser(authStorage.getUser());
    };

    window.addEventListener('profile:updated', refreshUser);
    window.addEventListener('storage', refreshUser);

    return () => {
      window.removeEventListener(
        'profile:updated',
        refreshUser,
      );

      window.removeEventListener('storage', refreshUser);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutside,
      );

      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    if (logoutPending.current) return;

    logoutPending.current = true;
    setLoggingOut(true);
    setError('');

    try {
      await onLogout?.();

      authStorage.clearSession();

      window.dispatchEvent(
        new Event('profile:updated'),
      );

      navigate(loginPath, { replace: true });
    } catch {
      setError('No se pudo cerrar la sesión. Inténtalo otra vez.');
    } finally {
      logoutPending.current = false;
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  const fullName =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.username ||
    'Usuario';

  const initials =
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U';

  const avatarUrl = user.avatarUrl;
  const showAvatar = avatarUrl && avatarUrl !== failedAvatar;

  const roleLabel =
    user.role === 'admin' ? 'Administrador' : 'Cliente';

  return (
    <header className="relative z-40 flex min-h-[80px] items-center justify-between gap-3 border-b border-purple-100 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <Link
        to={homePath}
        className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white lg:hidden">
          <Gift size={21} aria-hidden="true" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-purple-950 sm:text-base">
            ChristmasCards
          </span>

          <span className="hidden text-xs text-slate-500 sm:block">
            Panel de administración
          </span>
        </span>
      </Link>

      <div
        ref={containerRef}
        className="relative"
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget as Node | null,
            )
          ) {
            setOpen(false);
          }
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Cuenta de ${fullName}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/60 p-1.5 pr-3 text-left outline-none transition hover:bg-purple-100/60 focus-visible:ring-2 focus-visible:ring-purple-400 sm:gap-3"
        >
          {showAvatar ? (
            <img
              src={avatarUrl}
              alt=""
              onError={() =>
                setFailedAvatar(avatarUrl ?? null)
              }
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-sm font-black text-white"
            >
              {initials}
            </span>
          )}

          <span className="hidden min-w-0 sm:block">
            <strong className="block max-w-[180px] truncate text-sm text-purple-950">
              {fullName}
            </strong>

            <span className="text-xs text-slate-500">
              {roleLabel}
            </span>
          </span>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`text-purple-500 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            id={panelId}
            className="absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-xl shadow-purple-950/10"
          >
            <div className="bg-gradient-to-r from-purple-900 to-violet-900 p-5 text-white">
              <p className="break-words font-bold">
                {fullName}
              </p>

              <p className="mt-1 break-all text-xs text-purple-200">
                @{user.username}
              </p>

              <p className="mt-3 break-all text-sm text-purple-100">
                {user.email}
              </p>

              <span className="mt-3 inline-block rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                {roleLabel}
              </span>
            </div>

            <div className="space-y-1 p-2">
              <Link
                to={editProfilePath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-purple-950 outline-none hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <Pencil size={17} aria-hidden="true" />
                Editar perfil
              </Link>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
              >
                {loggingOut ? (
                  <LoaderCircle
                    size={17}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <LogOut size={17} aria-hidden="true" />
                )}

                {loggingOut
                  ? 'Cerrando sesión…'
                  : 'Cerrar sesión'}
              </button>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}