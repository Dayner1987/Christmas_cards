import {
  BarChart3,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuarios',
    icon: Users,
  },
  {
    label: 'Tarjetas',
    icon: Gift,
  },
  {
    label: 'Categorías',
    icon: Gift,
  },
  {
    label: 'Pedidos',
    icon: ShoppingBag,
  },
  {
    label: 'Listas de deseos',
    icon: Heart,
  },
  {
    label: 'Estadísticas',
    icon: BarChart3,
  },
  {
    label: 'Configuración',
    icon: Settings,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-[#102a43] text-white lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
          <Gift size={21} />
        </div>

        <div>
          <p className="font-black">ChristmasCards</p>
          <span className="text-xs text-slate-300">
            Administrador
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                index === 0
                  ? 'bg-white/15 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button className="m-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  );
}