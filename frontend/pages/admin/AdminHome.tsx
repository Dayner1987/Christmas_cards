// src/pages/admin/AdminHome.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarHeart, Gift, Layers, RefreshCw,
  ShieldCheck, Users,
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { getUsers } from '../../api/users';
import { getAdminGroups } from '../../api/groups';
import { getAdminCards } from '../../api/cards';
import { getSecretSantaTemplates } from '../../api/secret_santa_events';
import { getApiError } from '../../api/http';

type Statistics = {
  users: number | null;
  groups: number | null;
  cards: number | null;
  publicCards: number | null;
  templates: number | null;
};
const empty: Statistics = { users: null, groups: null, cards: null, publicCards: null, templates: null };
const links = [
  { to: '/admin/users', label: 'Usuarios', detail: 'Administrar cuentas y permisos', icon: Users },
  { to: '/admin/cards', label: 'Tarjetas', detail: 'Crear y publicar con una sola imagen', icon: Gift },
  { to: '/admin/groups', label: 'Grupos', detail: 'Consultar y administrar grupos', icon: Layers },
  { to: '/admin/secret-santa', label: 'Amigo secreto', detail: 'Crear eventos globales sin IDs', icon: CalendarHeart },
];

export default function HomeAdmin() {
  const [stats, setStats] = useState<Statistics>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    const calls = await Promise.allSettled([getUsers(), getAdminGroups(), getAdminCards(), getSecretSantaTemplates()]);
    setStats({
      users: calls[0].status === 'fulfilled' ? calls[0].value.length : null,
      groups: calls[1].status === 'fulfilled' ? calls[1].value.length : null,
      cards: calls[2].status === 'fulfilled' ? calls[2].value.filter((card) => card.isActive).length : null,
      publicCards: calls[2].status === 'fulfilled' ? calls[2].value.filter((card) => card.isActive && card.isPublic).length : null,
      templates: calls[3].status === 'fulfilled' ? calls[3].value.length : null,
    });
    const failed = calls.find((item) => item.status === 'rejected');
    if (failed && failed.status === 'rejected') {
      setError(`Algunas estadísticas no están disponibles: ${getApiError(failed.reason)}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const tiles = [
    ['Usuarios registrados', stats.users, Users],
    ['Grupos', stats.groups, Layers],
    ['Tarjetas públicas', stats.publicCards, Gift],
    ['Eventos globales', stats.templates, CalendarHeart],
  ] as const;

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#fff9f7]">
      <AdminSidebar />
      <main className="min-w-0 w-full flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-7">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 to-red-700 p-7 text-white sm:p-10">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Panel de administración</p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Bienvenido a ChristmasCards</h1>
              <p className="mt-4 text-sm leading-7 text-red-100">Gestiona tus tarjetas, grupos y celebraciones desde un solo lugar.</p>
              <Link to="/admin/secret-santa" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-red-800 hover:bg-red-50">Gestionar celebraciones <ArrowRight size={17}/></Link>
            </div>
            <img src="https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=75"
              alt="" loading="lazy" className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover opacity-30 lg:block"/>
          </section>
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-red-950">Resumen del sistema</h2>
              <button type="button" onClick={() => void reload()} disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Actualizar
              </button>
            </div>
            {error && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {tiles.map(([label, value, Icon]) => (
                <div key={label} className="min-w-0 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
                  <Icon size={24} className="text-red-600"/>
                  <p className="mt-5 text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-red-950">{loading && value === null ? '…' : value ?? '—'}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Datos reales del servidor. El guion indica que la información no está disponible.</p>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-black text-red-950">Accesos rápidos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {links.map(({ to, label, detail, icon: Icon }) => (
                <Link to={to} key={to} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700"><Icon size={23}/></div>
                  <div className="min-w-0 flex-1"><h3 className="font-black text-red-950">{label}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div>
                  <ArrowRight className="shrink-0 text-red-700 transition group-hover:translate-x-1" size={18}/>
                </Link>
              ))}
            </div>
          </section>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-100 bg-white p-5 text-sm text-slate-600">
            <ShieldCheck size={21} className="text-red-600"/>
            Solo administradores pueden editar los eventos globales. Los organizadores eligen un evento para sus propios grupos.
          </div>
        </div>
      </main>
    </div>
  );
}
