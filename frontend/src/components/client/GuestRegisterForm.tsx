
 // src/components/client/GuestRegisterForm.tsx

import { useState } from 'react';
import type { FormEvent } from 'react';

import {
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  X,
} from 'lucide-react';

import { registerGuestAccount } from '../../api/guests';
import { getApiError } from '../../api/http';
import { authStorage } from '../../config/auth.storage';
import { guestStorage } from '../../config/guest.storage';

interface Props {
  token: string;
  groupId: string;
  onCancel: () => void;
}

export default function GuestRegisterForm({
  token,
  groupId,
  onCancel,
}: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    if (!username.trim() || !email.trim()) {
      setError('Completa tu nombre de usuario y correo.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const response = await registerGuestAccount(token, {
        username: username.trim(),
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        password,
      });

      authStorage.saveSession(response);
      guestStorage.clear(groupId);

      // Recargar permite que todos los hooks de
      // autenticación lean la nueva sesión.
      window.location.assign(`/home/groups/${response.groupId}`);
    } catch (cause) {
      setError(getApiError(cause));
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-lg sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            <UserPlus size={16} />
            Únete a ChristmasCards
          </span>

          <h2 className="mt-4 text-2xl font-black text-red-950">
            Crea tu cuenta
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Conservaremos tu participación en el grupo,
            tu fotografía y tu lista de deseos.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar formulario"
          className="cursor-pointer rounded-lg p-2 text-red-700 hover:bg-red-50"
        >
          <X size={21} />
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={(event) => void submit(event)}
        noValidate
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <label className="block text-sm font-semibold text-red-950">
          Nombre de usuario *
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            maxLength={50}
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Mi usuario"
          />
        </label>

        <label className="block text-sm font-semibold text-red-950">
          Correo electrónico *
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="correo@ejemplo.com"
          />
        </label>

        <label className="block text-sm font-semibold text-red-950">
          Nombres
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            maxLength={80}
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Tu nombre"
          />
        </label>

        <label className="block text-sm font-semibold text-red-950">
          Apellidos
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            maxLength={80}
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Tus apellidos"
          />
        </label>

        <label className="block text-sm font-semibold text-red-950">
          Contraseña *
          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-red-200 px-4 py-3 pr-12 outline-none focus:border-red-500"
              placeholder="Mínimo 8 caracteres"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-red-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </label>

        <label className="block text-sm font-semibold text-red-950">
          Confirmar contraseña *
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Repite tu contraseña"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-3 sm:col-span-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-red-200 px-6 py-3 font-bold text-red-700 transition hover:bg-red-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
