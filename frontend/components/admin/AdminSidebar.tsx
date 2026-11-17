
 // src/components/admin/AdminSidebar.tsx

import { useEffect, useState } from 'react';
import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  CalendarDays,
  Gift,
  Heart,
  Home,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  UserRoundPen,
  Users,
  X,
} from 'lucide-react';

import MobileNavbar from './users/mobileNavbar';
import { authStorage } from '../../config/auth.storage';

const links = [
  {
    label: 'Inicio',
    to: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Usuarios',
    to: '/admin/users',
    icon: Users,
    end: false,
  },
  {
    label: 'Tarjetas',
    to: '/admin/cards',
    icon: Gift,
    end: false,
  },
  {
    label: 'Grupos',
    to: '/admin/groups',
    icon: Layers,
    end: false,
  },
  {
    label: 'Listas de deseos',
    to: '/admin/wishlists',
    icon: Heart,
    end: false,
  },
  {
    label: 'Amigo secreto',
    to: '/admin/secret-santa',
    icon: CalendarDays,
    end: false,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const logout = () => {
    setOpen(false);

    authStorage.clearSession();

    window.dispatchEvent(
      new Event('profile:updated'),
    );

    navigate('/login', { replace: true });
  };

  const linkClass =
    'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10';

  return (
    <>
      {/* NAVBAR MÓVIL CON PERFIL */}
      <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
        <div className="[&>header]:pl-16">
          <MobileNavbar
            homePath="/admin"
            editProfilePath="/admin/perfil/editar"
            loginPath="/login"
          />
        </div>

        {/* BOTÓN PARA ABRIR EL MENÚ */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="absolute left-3 top-3 z-50 grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-red-50 text-red-800 transition hover:bg-red-100"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* FONDO OSCURO EN MÓVIL */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-black/60 lg:hidden"
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        aria-label="Panel de administración"
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 shrink-0 flex-col
          overflow-hidden
          bg-gradient-to-b from-red-950 to-red-900
          text-white shadow-xl
          transition-transform duration-200
          lg:sticky lg:top-0 lg:h-screen
          lg:translate-x-0 lg:shadow-none
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* LOGOTIPO */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600">
              <Gift size={21} />
            </span>

            <span>
              <span className="block text-sm font-black">
                ChristmasCards
              </span>

              <span className="text-xs text-red-200">
                Administrador
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="cursor-pointer rounded-lg p-2 text-red-100 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {links.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-rose-100'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* CUENTA Y SESIÓN */}
        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <NavLink
            to="/admin/perfil/editar"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `${linkClass} ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-rose-100'
              }`
            }
          >
            <UserRoundPen size={18} />
            Editar mi perfil
          </NavLink>

          <NavLink
            to="/"
            onClick={() => setOpen(false)}
            className={`${linkClass} text-rose-100`}
          >
            <Home size={18} />
            Ver página principal
          </NavLink>

          <button
            type="button"
            onClick={logout}
            className={`${linkClass} w-full text-left text-rose-100 hover:bg-red-600/50`}
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
