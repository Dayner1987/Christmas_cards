import { NavLink } from 'react-router-dom';

import {
  Gift,
  Heart,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/admin',
    end: true,
  },
  {
    label: 'Usuarios',
    icon: Users,
    to: '/admin/users',
    end: false,
  },
  {
    label: 'Tarjetas',
    icon: Gift,
    to: '/admin/cards',
    end: false,
  },
  {
    label: 'Grupos',
    icon: ShoppingBag,
    to: '/admin/groups',
    end: false,
  },
  {
    label: 'Listas de deseos',
    icon: Heart,
    to: '/admin/wishlists',
    end: false,
  },
  {
    label: 'Eventos Navideños',
    icon: Settings,
    to: '/admin/perfil/editar',
    end: false,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-violet-950 via-purple-950 to-purple-900 text-white lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-black/10">
          <Gift size={23} aria-hidden="true" />
        </div>

        <div>
          <p className="font-black tracking-tight">
            ChristmasCards
          </p>

          <span className="text-xs text-purple-200">
            Administrador
          </span>
        </div>
      </div>

      <nav
        aria-label="Menú de administración"
        className="flex-1 space-y-2 px-4 py-6"
      >
        <p className="mb-4 px-4 text-[11px] font-bold uppercase tracking-widest text-purple-300">
          Principal
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-fuchsia-300 ${
                  isActive
                    ? 'bg-white/15 font-bold text-white shadow-sm ring-1 ring-white/10'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon
                size={19}
                aria-hidden="true"
                className="shrink-0"
              />

              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Sparkles
          size={20}
          aria-hidden="true"
          className="mb-3 text-fuchsia-300"
        />

        <p className="text-sm font-bold">
          Momentos que conectan
        </p>

        <p className="mt-2 text-xs leading-5 text-purple-200">
          Un espacio para compartir deseos y crear
          recuerdos especiales.
        </p>
      </div>
    </aside>
  );
}