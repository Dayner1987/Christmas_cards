import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Gift,
  Heart,
  LayoutDashboard,
  Menu,
  ShoppingBag,
  Sparkles,
  Users,
  X,
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
    icon: Calendar,
    to: '/admin/secret-santa',
    end: false,
  },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 1. BARRA SUPERIOR MÓVIL */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-violet-950 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-sm font-black tracking-tight text-white">ChristmasCards</p>
            <p className="text-[10px] text-purple-200">Panel Admin</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-md">
            <Gift size={18} className="text-white" />
          </div>
        </div>
      </header>

      {/* Espaciador móvil */}
      <div className="h-20 w-full shrink-0 lg:hidden" />

      {/* 2. BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. SIDEBAR (Con scrollbar invisible) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-violet-950 via-purple-950 to-purple-900 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera interna */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-black/10">
              <Gift size={22} aria-hidden="true" />
            </div>

            <div>
              <p className="font-black tracking-tight">ChristmasCards</p>
              <span className="text-xs text-purple-200">Administrador</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-purple-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación con Scrollbar oculta */}
        <nav
          aria-label="Menú de administración"
          className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
            Principal
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 font-bold text-white shadow-sm ring-1 ring-white/15'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={19} aria-hidden="true" className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Tarjeta decorativa inferior */}
        <div className="p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <Sparkles size={20} aria-hidden="true" className="mb-2 text-fuchsia-300" />
            <p className="text-sm font-bold">Momentos que conectan</p>
            <p className="mt-1 text-xs leading-relaxed text-purple-200">
              Un espacio para compartir deseos y crear recuerdos especiales.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}