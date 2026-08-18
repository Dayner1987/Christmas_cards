import {
  LogOut,
  Gift,
  UserRound,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../hooks/auth.hooks';

export default function ClientHome() {
  const navigate = useNavigate();

  const {
    user,
    logoutUser,
  } = useAuth();

  const handleLogout = () => {
    logoutUser();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Gift size={22} />
            </div>

            <div>
              <p className="font-black text-slate-900">
                ChristmasCards
              </p>

              <p className="text-xs text-slate-500">
                Navidad 2026
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-purple-700 to-fuchsia-600 p-8 text-white shadow-xl shadow-purple-500/15">
          <div className="flex items-center gap-3">
            <UserRound size={26} />

            <span className="text-sm font-semibold text-purple-100">
              Tu cuenta
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Hola,{' '}
            {user?.firstName ||
              user?.username ||
              'usuario'}
            
          </h1>

          <p className="mt-2 text-purple-100">
            Ya estás dentro de ChristmasCards.
          </p>
        </div>
      </section>
    </main>
  );
}