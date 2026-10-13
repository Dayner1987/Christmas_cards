
 // src/pages/RegisterPage.tsx

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';

import Swal from 'sweetalert2';

import { useAuth } from '../hooks/auth.hooks';
import { authStorage } from '../config/auth.storage';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100';

export default function RegisterPage() {
  const navigate = useNavigate();

  const { registerUser, loading, error } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const showWarning = async (message: string) => {
    setLocalError(message);

    await Swal.fire({
      icon: 'warning',
      title: 'Revisa tus datos',
      text: message,
      confirmButtonColor: '#b91c1c',
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setLocalError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      await showWarning('Ingresa un nombre de usuario.');
      return;
    }

    if (!cleanEmail) {
      await showWarning('Ingresa tu correo electrónico.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      await showWarning('Ingresa un correo electrónico válido.');
      return;
    }

    if (!password) {
      await showWarning('Ingresa una contraseña.');
      return;
    }

    if (password.length < 8) {
      await showWarning(
        'La contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    if (!confirmPassword) {
      await showWarning('Confirma tu contraseña.');
      return;
    }

    if (password !== confirmPassword) {
      await showWarning('Las contraseñas no coinciden.');
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
        text: 'Te damos la bienvenida a ChristmasCards.',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        iconColor: '#10b981',
      });

      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : error || 'No se pudo registrar la cuenta.';

      setLocalError(message);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo crear la cuenta',
        text: message,
        confirmButtonColor: '#b91c1c',
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-rose-900">

      {/* DECORACIONES */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-rose-400/20 blur-3xl" />

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/10 bg-red-950/40 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">

          <Link
            to="/"
            className="flex cursor-pointer items-center gap-3 rounded-xl text-white transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">
              Volver al inicio
            </span>
            <span className="sm:hidden">Inicio</span>
          </Link>

        </nav>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 px-4 py-10 sm:py-14">
        <section className="mx-auto flex max-w-6xl items-center justify-center">

          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2">

            {/* PANEL IZQUIERDO */}
            <div className="relative hidden min-h-[720px] flex-col justify-between overflow-hidden bg-white/10 p-12 lg:flex">

              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

              <div className="relative z-10">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-700 shadow-xl">
                  <Gift size={30} />
                </div>

                <h1 className="max-w-md text-5xl font-black leading-tight text-white">
                  Crea recuerdos que duren más que{' '}
                  <span className="text-rose-300">
                    un regalo.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-lg leading-8 text-red-100/80">
                  Únete a ChristmasCards y organiza
                  celebraciones, listas de deseos y
                  amigos secretos con las personas
                  que más quieres.
                </p>
              </div>

              <div className="relative z-10 rounded-3xl border border-white/10 bg-black/10 p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-yellow-300" />
                  <span className="font-bold text-white">
                    Tu Navidad, organizada
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-red-100/70">
                  Crea tus grupos, invita amigos y
                  comparte momentos especiales.
                </p>
              </div>

            </div>

            {/* FORMULARIO */}
            <div className="bg-white px-6 py-10 sm:px-12 lg:px-14">
              <div className="mx-auto max-w-md">

                {/* LOGO PARA MÓVILES */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                    <Gift size={23} />
                  </div>

                  <span className="text-xl font-black text-red-950">
                    ChristmasCards
                  </span>
                </div>

                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                  Nueva cuenta
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Crea tu cuenta
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Completa tus datos para comenzar.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5"
                  noValidate
                >

                  {/* NOMBRE DE USUARIO */}
                  <Field
                    id="register-username"
                    label="Nombre de usuario"
                    icon={<User size={18} />}
                  >
                    <input
                      id="register-username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={50}
                      placeholder="Tu nombre de usuario"
                      autoComplete="username"
                      className={inputClass}
                    />
                  </Field>

                  {/* CORREO */}
                  <Field
                    id="register-email"
                    label="Correo electrónico"
                    icon={<Mail size={18} />}
                  >
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@gmail.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </Field>

                  {/* NOMBRE Y APELLIDO */}
                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      id="register-firstname"
                      label="Nombre"
                      icon={<User size={18} />}
                    >
                      <input
                        id="register-firstname"
                        name="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        maxLength={80}
                        placeholder="Juan"
                        autoComplete="given-name"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      id="register-lastname"
                      label="Apellido"
                      icon={<User size={18} />}
                    >
                      <input
                        id="register-lastname"
                        name="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        maxLength={80}
                        placeholder="Pérez"
                        autoComplete="family-name"
                        className={inputClass}
                      />
                    </Field>

                  </div>

                  {/* CONTRASEÑA */}
                  <Field
                    id="register-password"
                    label="Contraseña"
                    icon={<LockKeyhole size={18} />}
                  >
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={`${inputClass} pr-12`}
                    />

                    <PasswordButton
                      show={showPassword}
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                    />
                  </Field>

                  {/* CONFIRMAR CONTRASEÑA */}
                  <Field
                    id="register-confirm-password"
                    label="Confirmar contraseña"
                    icon={<LockKeyhole size={18} />}
                  >
                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </Field>

                  {/* MENSAJE DE ERROR */}
                  {localError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                    >
                      {localError}
                    </div>
                  )}

                  {/* BOTÓN CREAR CUENTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100"
                  >
                    {loading
                      ? 'Creando cuenta...'
                      : 'Crear mi cuenta'}
                  </button>

                </form>

                {/* ACCESO AL LOGIN */}
                <div className="mt-8 border-t border-slate-100 pt-7 text-center">
                  <p className="text-sm text-slate-500">
                    ¿Ya tienes una cuenta?{' '}

                    <Link
                      to="/login"
                      className="cursor-pointer font-bold text-red-600 transition hover:text-red-800 hover:underline"
                    >
                      Iniciar sesión
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

/* CAMPO REUTILIZABLE */
function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        {children}
      </div>
    </div>
  );
}

/* BOTÓN PARA MOSTRAR CONTRASEÑA */
function PasswordButton({
  show,
  onClick,
}: {
  show: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        show ? 'Ocultar contraseña' : 'Mostrar contraseña'
      }
      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:scale-110 hover:text-red-600"
    >
      {show ? (
        <EyeOff size={19} />
      ) : (
        <Eye size={19} />
      )}
    </button>
  );
}
