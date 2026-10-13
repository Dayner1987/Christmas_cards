
 // src/components/client/ClientNavbar.tsx

import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Gift,
  House,
  Mail,
  CalendarHeart,
  Users,
  LogOut,
  UserRound,
} from 'lucide-react';

import { Inbox } from 'lucide-react';

import { useAuth } from '../../hooks/auth.hooks';

const navigation = [
  { label: 'Inicio', path: '/home', icon: House, end: true },
  { label: 'Cartas', path: '/home/cards', icon: Mail },
  { label: 'Eventos', path: '/home/events', icon: CalendarHeart },
  { label: 'Mi espacio', path: '/home/my-space', icon: Users },
  
{
  label: 'Mi buzón',
  path: '/home/mailbox',
  icon: Inbox,
},

];

export default function ClientNavbar() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  const logout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-red-100 bg-white/95 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/home"
          className="flex cursor-pointer items-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-200">
            <Gift size={24} />
          </span>
          <span className="text-lg font-black tracking-tight text-red-950">
            ChristmasCards
          </span>
        </Link>

        <div className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-red-50 pt-3 md:order-2 md:w-auto md:border-0 md:pt-0">
          {navigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="order-2 flex items-center gap-2 md:order-3">
          <Link
            to="/perfil/editar"
            title="Mi perfil"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 px-2 py-1.5 transition hover:bg-red-50"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Mi foto"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700">
                <UserRound size={19} />
              </span>
            )}
            <span className="hidden max-w-24 truncate text-sm font-bold text-red-950 lg:block">
              {user?.firstName || user?.username}
            </span>
          </Link>

          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="cursor-pointer rounded-xl p-3 text-red-700 transition hover:bg-red-50 hover:scale-105 active:scale-95"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </header>
  );
}
