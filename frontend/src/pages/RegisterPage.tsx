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
  User,
} from 'lucide-react';

import { useAuth } from '../hooks/auth.hooks';
import { authStorage } from '../config/auth.storage';

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    registerUser,
    loading,
    error,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState<string | null>(
    null,
  );

  // =====================================================
  // SI YA EXISTE SESIÓN
  // =====================================================

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate('/home', {
        replace: true,
      });
    }
  }, [navigate]);

  // =====================================================
  // REGISTER
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError(
        'Las contraseñas no coinciden',
      );

      return;
    }

    if (password.length < 8) {
      setLocalError(
        'La contraseña debe tener al menos 8 caracteres',
      );

      return;
    }

    try {
      await registerUser({
        username: username.trim(),
        email: email.trim(),

        password,

        firstName:
          firstName.trim() || undefined,

        lastName:
          lastName.trim() || undefined,
      });

      navigate('/home', {
        replace: true,
      });
    } catch {
      // useAuth gestiona el error.
    }
  };

  const displayedError =
    localError || error;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-fuchsia-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2">

          {/* ================================================= */}
          {/* IZQUIERDA */}
          {/* ================================================= */}

          <div className="relative hidden min-h-[720px] flex-col justify-between overflow-hidden bg-white/10 p-12 lg:flex">
            <div className="relative z-10">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-xl">
                <Gift size={30} />
              </div>

              <h1 className="max-w-md text-5xl font-black leading-tight text-white">
                Crea recuerdos que duren más que
                <span className="text-fuchsia-300">
                  {' '}
                  un regalo.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-purple-100/80">
                Únete a ChristmasCards y organiza
                celebraciones, deseos y amigos secretos
                con las personas que más quieres.
              </p>
            </div>

            <div className="relative z-10 rounded-3xl border border-white/10 bg-black/10 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="text-yellow-300" />

                <span className="font-bold text-white">
                  Tu Navidad, organizada
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-purple-100/70">
                Crea grupos y comparte invitaciones de
                manera sencilla.
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <div className="bg-white px-6 py-9 sm:px-12 lg:px-14">
            <div className="mx-auto max-w-md">

              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Gift size={23} />
                </div>

                <span className="text-xl font-black text-purple-950">
                  ChristmasCards
                </span>
              </div>

              <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                Nueva cuenta
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                Crea tu cuenta
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Completa tus datos para comenzar.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-4"
              >
                {/* Username */}

                <Field
                  label="Nombre de usuario"
                  icon={<User size={18} />}
                >
                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value,
                      )
                    }
                    minLength={3}
                    maxLength={50}
                    required
                    placeholder="juampi"
                    autoComplete="username"
                    className={inputClass}
                  />
                </Field>

                {/* Email */}

                <Field
                  label="Correo electrónico"
                  icon={<Mail size={18} />}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value,
                      )
                    }
                    required
                    placeholder="correo@gmail.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>

                {/* Nombre + apellido */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nombre"
                    icon={<User size={18} />}
                  >
                    <input
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(
                          e.target.value,
                        )
                      }
                      maxLength={80}
                      placeholder="Juan"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Apellido"
                    icon={<User size={18} />}
                  >
                    <input
                      value={lastName}
                      onChange={(e) =>
                        setLastName(
                          e.target.value,
                        )
                      }
                      maxLength={80}
                      placeholder="Pérez"
                      className={inputClass}
                    />
                  </Field>
                </div>

                {/* Password */}

                <Field
                  label="Contraseña"
                  icon={
                    <LockKeyhole
                      size={18}
                    />
                  }
                >
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value,
                      )
                    }
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                  />

                  <PasswordButton
                    show={showPassword}
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                  />
                </Field>

                {/* Confirmación */}

                <Field
                  label="Confirmar contraseña"
                  icon={
                    <LockKeyhole
                      size={18}
                    />
                  }
                >
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value,
                      )
                    }
                    required
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>

                {displayedError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {displayedError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Creando cuenta...'
                    : 'Crear mi cuenta'}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-purple-600 hover:text-purple-800"
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
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100';

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
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
      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-purple-600"
    >
      {show ? (
        <EyeOff size={19} />
      ) : (
        <Eye size={19} />
      )}
    </button>
  );
}