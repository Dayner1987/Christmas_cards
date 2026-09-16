//src/pages/admin/AdminHome.tsx
import {
  Gift,
  Mail,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';
import CardsCategoryChart from '../../components/admin/CardsCategoryChart';
import RecentActivity from '../../components/admin/RecentActivity';
import StatCard from '../../components/admin/StatCard';
import UsersChart from '../../components/admin/UsersChart.';

export default function HomeAdmin() {
  return (
    <main className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />

      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Resumen general de la plataforma
              </p>

              <h1 className="mt-1 text-3xl font-black text-slate-900">
                Panel administrativo 2
              </h1>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              1 dic 2024 - 31 dic 2024
            </div>
          </header>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Usuarios registrados"
              value="1,284"
              change="+12% vs. mes anterior"
              icon={Users}
              iconClassName="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="Tarjetas enviadas"
              value="5,320"
              change="+26% vs. mes anterior"
              icon={Mail}
              iconClassName="bg-emerald-100 text-emerald-600"
            />

            <StatCard
              title="Listas creadas"
              value="3,890"
              change="+16% vs. mes anterior"
              icon={Package}
              iconClassName="bg-amber-100 text-amber-600"
            />

            <StatCard
              title="Tarjetas en catálogo"
              value="128"
              change="+6 nuevas"
              icon={Gift}
              iconClassName="bg-indigo-100 text-indigo-600"
            />
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <UsersChart />
            <CardsCategoryChart />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RecentActivity />

            <div className="flex min-h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-red-800 to-red-600 p-8 text-center text-white shadow-sm">
              <div>
                <ShieldCheck
                  className="mx-auto mb-4"
                  size={42}
                />

                <h2 className="text-2xl font-black">
                  ChristmasCards
                </h2>

                <p className="mt-2 text-sm text-red-100">
                  La Navidad también se vive detrás de cada historia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}