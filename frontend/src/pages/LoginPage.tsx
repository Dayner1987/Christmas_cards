
 // src/pages/LoginPage.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/auth.hooks';

const image =
  'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1200&q=85';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser, loading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Ingresa tu usuario o correo y tu contraseña.');
      return;
    }

    try {
      const result = await loginUser({
        identifier: identifier.trim(),
        password,
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        timer: 1100,
        showConfirmButton: false,
      });

      navigate(result.user.role === 'admin' ? '/admin' : '/home', {
        replace: true,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo iniciar sesión.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#42060a] via-[#760d18] to-[#ab2135] text-slate-900">
      <header className="border-b border-white/15 bg-red-950/30">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 font-black text-white"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-red-700">
              <Gift size={22} />
            </span>
            ChristmasCards
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl items-center px-4 py-10 sm:py-16 lg:min-h-[calc(100vh-80px)]">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1fr_1fr]">
          <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-red-950 p-12 text-white lg:flex">
            <img
              src={image}
              alt="Luces y adornos de Navidad"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-red-950/75 via-red-950/50 to-red-950/90" />

            <div className="relative z-10">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider">
                Un lugar para compartir
              </span>

              <h1 className="mt-9 text-5xl font-black leading-tight">
                La Navidad se disfruta más{' '}
                <span className="text-rose-200">juntos.</span>
              </h1>

              <p className="mt-6 max-w-sm text-base leading-8 text-white/90">
                Organiza tus grupos, comparte deseos y vive el amigo
                secreto con las personas que más quieres.
              </p>
            </div>

            <div className="relative z-10 rounded-2xl border border-white/25 bg-white/15 p-6 backdrop-blur-md">
              <p className="font-black">
                Celebra cada pequeño detalle
              </p>
              <p className="mt-2 text-sm leading-6 text-red-100">
                Tu próxima sorpresa comienza aquí.
              </p>
            </div>
          </div>

          <div className="flex items-center px-6 py-12 sm:px-12 lg:px-14">
            <div className="mx-auto w-full max-w-md">
              <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-red-700">
                Bienvenido de nuevo
              </span>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-red-950 sm:text-4xl">
                Inicia sesión
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Entra con tu usuario o correo electrónico para
                continuar tu celebración.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-9 space-y-5"
              >
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Usuario o correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Tu usuario o correo"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-red-600"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 px-5 font-black text-white shadow-lg shadow-red-100 transition hover:from-red-800 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="mt-8 border-t border-slate-100 pt-7 text-center text-sm text-slate-500">
                ¿Todavía no tienes una cuenta?{' '}
                <Link
                  to="/register"
                  className="font-black text-red-700 hover:underline"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
