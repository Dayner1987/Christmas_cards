import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../hooks/auth.hooks';
import { authStorage } from '../config/auth.storage';

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    loginUser,
    loading,
    error,
  } = useAuth();

  const [
    identifier,
    setIdentifier,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  // =====================================================
  // SI YA EXISTE SESIÓN, NO MOSTRAMOS LOGIN
  // =====================================================

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate('/home', {
        replace: true,
      });
    }
  }, [navigate]);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      return;
    }

    try {
      await loginUser({
        identifier: identifier.trim(),
        password,
      });

      // Por ahora todos los usuarios normales
      // ingresan a ClientHome.
      navigate('/home', {
        replace: true,
      });
    } catch {
      // El error ya es gestionado por useAuth().
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 px-4 py-10">
      {/* Decoraciones */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/10 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2">

          {/* ================================================= */}
          {/* PANEL IZQUIERDO */}
          {/* ================================================= */}

          <div className="relative hidden min-h-[650px] flex-col justify-between overflow-hidden bg-white/10 p-12 lg:flex">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

            <div className="relative z-10">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-xl">
                <Gift size={30} />
              </div>

              <h1 className="max-w-md text-5xl font-black leading-tight text-white">
                La Navidad se disfruta más
                <span className="text-fuchsia-300">
                  {' '}
                  juntos.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-purple-100/80">
                Organiza tus grupos, comparte deseos,
                envía tarjetas y vive el amigo secreto
                desde un solo lugar.
              </p>
            </div>

            <div className="relative z-10 rounded-3xl border border-white/10 bg-black/10 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="text-yellow-300" />

                <p className="font-semibold text-white">
                  ChristmasCards
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-purple-100/70">
                Una experiencia diseñada para compartir
                momentos especiales con familia y amigos.
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* FORMULARIO */}
          {/* ================================================= */}

          <div className="bg-white px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
            <div className="mx-auto max-w-md">

              {/* Logo móvil */}

              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Gift size={23} />
                </div>

                <span className="text-xl font-black text-purple-950">
                  ChristmasCards
                </span>
              </div>

              <div>
                <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                  Bienvenido
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Inicia sesión
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ingresa con tu nombre de usuario o
                  correo electrónico.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-9 space-y-5"
              >
                {/* Usuario / email */}

                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Usuario o correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(event) =>
                        setIdentifier(
                          event.target.value,
                        )
                      }
                      placeholder="juampi o juampi@gmail.com"
                      autoComplete="username"
                      required
                      className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>

                {/* Password */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Contraseña
                    </label>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-purple-600"
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Iniciando sesión...'
                    : 'Iniciar sesión'}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-7 text-center">
                <p className="text-sm text-slate-500">
                  ¿Todavía no tienes una cuenta?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-purple-600 transition hover:text-purple-800"
                  >
                    Crear cuenta
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}