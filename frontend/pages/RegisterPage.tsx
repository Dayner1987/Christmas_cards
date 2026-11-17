
 // src/pages/RegisterPage.tsx
import { useEffect, useState } from 'react';
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
  User,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../hooks/auth.hooks';
import { authStorage } from '../config/auth.storage';

const photo =
  'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=1200&q=85';

const fieldStyle =
  'w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser, loading, error: apiError } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      setLocalError('Escribe tu nombre de usuario.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError('Introduce un correo electrónico válido.');
      return;
    }

    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await registerUser({
        username: cleanUsername,
        email: cleanEmail,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Cuenta creada!',
        timer: 1200,
        showConfirmButton: false,
      });

      navigate('/home', { replace: true });
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : apiError || 'No se pudo crear la cuenta.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#42060a] via-[#760d18] to-[#ab2135]">
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

      <main className="mx-auto flex max-w-6xl items-center px-4 py-10 sm:py-16">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-2">
          <div className="relative hidden min-h-[790px] flex-col justify-between overflow-hidden p-12 text-white lg:flex">
            <img
              src={photo}
              alt="Regalos y decoración de Navidad"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-red-950/80 via-red-950/40 to-red-950/90" />

            <div className="relative z-10">
              <span className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider">
                La magia de compartir
              </span>

              <h1 className="mt-10 text-5xl font-black leading-tight">
                Crea recuerdos que duren más que{' '}
                <span className="text-rose-200">un regalo.</span>
              </h1>

              <p className="mt-6 max-w-sm leading-8 text-red-100">
                Crea grupos, comparte tu lista de deseos e invita a
                tus personas favoritas a celebrar.
              </p>
            </div>

            <p className="relative z-10 rounded-2xl border border-white/25 bg-white/15 p-6 text-sm leading-7 backdrop-blur-md">
              Cada celebración comienza con una invitación.
              La próxima puede ser la tuya.
            </p>
          </div>

          <div className="px-6 py-10 sm:px-12 lg:px-14">
            <div className="mx-auto max-w-md">
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-red-700">
                Únete a la celebración
              </span>

              <h2 className="mt-5 text-3xl font-black text-red-950 sm:text-4xl">
                Crea tu cuenta
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                Completa tus datos y comienza a compartir.
              </p>

              <form
                onSubmit={submit}
                noValidate
                className="mt-7 space-y-4"
              >
                <div>
                  <label htmlFor="reg-username" className="mb-2 block text-sm font-bold text-slate-700">
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-username"
                      autoComplete="username"
                      value={username}
                      maxLength={50}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Tu usuario"
                      className={fieldStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="mb-2 block text-sm font-bold text-slate-700">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={fieldStyle}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-first" className="mb-2 block text-sm font-bold text-slate-700">
                      Nombre (opcional)
                    </label>
                    <input
                      id="reg-first"
                      autoComplete="given-name"
                      value={firstName}
                      maxLength={80}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      className={`${fieldStyle} pl-4`}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-last" className="mb-2 block text-sm font-bold text-slate-700">
                      Apellido (opcional)
                    </label>
                    <input
                      id="reg-last"
                      autoComplete="family-name"
                      value={lastName}
                      maxLength={80}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Pérez"
                      className={`${fieldStyle} pl-4`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="mb-2 block text-sm font-bold text-slate-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`${fieldStyle} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-red-600"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="mb-2 block text-sm font-bold text-slate-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className={`${fieldStyle} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-red-600"
                    >
                      {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {localError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  >
                    {localError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 px-5 font-black text-white transition hover:from-red-800 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="font-black text-red-700 hover:underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
