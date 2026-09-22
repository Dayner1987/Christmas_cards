//src/pages/admin/adminHome
import {
  Gift,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';

import CardsCategoryChart from '../../components/admin/CardsCategoryChart';
import RecentActivity from '../../components/admin/RecentActivity';
import StatCard from '../../components/admin/StatCard';

import MobileNavbar from '../../components/admin/users/mobileNavbar';

export default function HomeAdmin() {
  return (
    <div className="flex min-h-screen bg-[#f8f7fc]">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <MobileNavbar />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-purple-900 to-fuchsia-800 p-6 text-white shadow-lg shadow-purple-900/10 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl"
              />

              <div className="relative flex items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-100">
                    <Sparkles size={14} />
                    Panel de administración
                  </span>

                  <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    Bienvenido a ChristmasCards
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-purple-100">
                    Administra usuarios, tarjetas y grupos
                    desde un solo lugar.
                  </p>
                </div>

                <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 sm:flex">
                  <Gift size={40} aria-hidden="true" />
                </div>
              </div>
            </section>

            <section aria-label="Estadísticas generales">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-purple-950">
                  Resumen general
                </h2>

                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  Datos de demostración
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Usuarios registrados"
                  value="1,284"
                  change="+12% vs. mes anterior"
                  icon={Users}
                  iconClassName="bg-purple-100 text-purple-600"
                />

                <StatCard
                  title="Tarjetas enviadas"
                  value="5,320"
                  change="+26% vs. mes anterior"
                  icon={Mail}
                  iconClassName="bg-fuchsia-100 text-fuchsia-600"
                />

                <StatCard
                  title="Listas creadas"
                  value="3,890"
                  change="+16% vs. mes anterior"
                  icon={Package}
                  iconClassName="bg-violet-100 text-violet-600"
                />

                <StatCard
                  title="Tarjetas en catálogo"
                  value="128"
                  change="+6 nuevas"
                  icon={Gift}
                  iconClassName="bg-indigo-100 text-indigo-600"
                />
              </div>
            </section>

            <section
              aria-label="Gráficos"
              className="grid grid-cols-1 gap-6 xl:grid-cols-2"
            >
              <div className="min-w-0">
                
              </div>

              <div className="min-w-0">
                <CardsCategoryChart />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="min-w-0">
                <RecentActivity />
              </div>

              <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-100 via-white to-fuchsia-100 p-8 text-center">
                <div>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
                    <ShieldCheck
                      size={32}
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="text-2xl font-black text-purple-950">
                    Compartir nos une
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
                    Cada tarjeta, cada deseo y cada grupo
                    hacen que la Navidad sea más especial.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}