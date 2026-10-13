

// src/pages/LoginPage.tsx

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react';

import Swal from 'sweetalert2';

import { useAuth } from '../hooks/auth.hooks';

export default function LoginPage() {
  const navigate = useNavigate();

  const { loginUser, loading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Ingresa tu usuario y contraseña.',
        confirmButtonColor: '#b91c1c',
      });
      return;
    }

    try {
      const response = await loginUser({
        identifier: identifier.trim(),
        password,
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente.',
        timer: 1400,
        showConfirmButton: false,
      });

      navigate(
        response.user.role === 'admin'
          ? '/admin'
          : '/home',
        { replace: true },
      );
    } catch (err: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo iniciar sesión',
        text:
          err instanceof Error
            ? err.message
            : 'Verifica tus credenciales.',
        confirmButtonColor: '#b91c1c',
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-rose-900">
      {/* Decoraciones */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-rose-400/20 blur-3xl" />

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/10 bg-red-950/40 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-700 shadow-lg">
              <Gift size={24} />
            </span>

            <span className="text-lg font-black tracking-tight sm:text-xl">
              ChristmasCards
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">
              Volver al inicio
            </span>
            <span className="sm:hidden">Inicio</span>
          </Link>
        </nav>
      </header>

      {/* CONTENIDO */}
      <main className="relative z-10 px-4 py-10 sm:py-14">
        <section className="mx-auto flex max-w-6xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2">

            {/* PANEL IZQUIERDO */}
            <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-white/10 p-12 lg:flex">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

              <div className="relative z-10">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-700 shadow-xl">
                  <Gift size={30} />
                </div>

                <h1 className="max-w-md text-5xl font-black leading-tight text-white">
                  La Navidad se disfruta más{' '}
                  <span className="text-rose-300">
                    juntos.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-lg leading-8 text-red-100/80">
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

                <p className="mt-2 text-sm leading-6 text-red-100/70">
                  Una experiencia para compartir
                  momentos especiales con familia y amigos.
                </p>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="bg-white px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
              <div className="mx-auto max-w-md">

                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                    <Gift size={23} />
                  </div>
                  <span className="text-xl font-black text-red-950">
                    ChristmasCards
                  </span>
                </div>

                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                  Bienvenido
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Inicia sesión
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ingresa con tu nombre de usuario o
                  correo electrónico.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-9 space-y-5"
                  noValidate
                >
                  {/* USUARIO */}
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
                        name="identifier"
                        type="text"
                        value={identifier}
                        onChange={(event) =>
                          setIdentifier(event.target.value)
                        }
                        placeholder="Tu usuario o correo"
                        autoComplete="username"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  {/* CONTRASEÑA */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Contraseña
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword ? 'text' : 'password'
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-600"
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* INICIAR SESIÓN */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? 'Iniciando sesión...'
                      : 'Iniciar sesión'}
                  </button>
                </form>

                {/* REGISTRO */}
                <div className="mt-8 border-t border-slate-100 pt-7 text-center">
                  <p className="text-sm text-slate-500">
                    ¿Todavía no tienes una cuenta?{' '}
                    <Link
                      to="/register"
                      className="font-bold text-red-600 transition hover:text-red-800"
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
    </div>
  );
}

