import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import {
  Link,
  Navigate,
} from 'react-router-dom';

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';

import { useUsers } from '../../../hooks/user.hook';

import { authStorage } from '../../../config/auth.storage';

import type {
  UpdateUser,
  User,
} from '../../../types/user.schema';

interface EditUserProps {
  backPath?: string;
  loginPath?: string;
}

interface ProfileForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  biography: string;
  birthDate: string;
  timezone: string;
  languageCode: string;
}

type Action = 'profile' | 'avatar' | 'remove' | 'password';

const initialForm: ProfileForm = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  biography: '',
  birthDate: '',
  timezone: 'America/La_Paz',
  languageCode: 'es',
};

const fields: {
  key: Exclude<keyof ProfileForm, 'biography'>;
  label: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}[] = [
  {
    key: 'firstName',
    label: 'Nombre',
    type: 'text',
    autoComplete: 'given-name',
    maxLength: 80,
  },
  {
    key: 'lastName',
    label: 'Apellidos',
    type: 'text',
    autoComplete: 'family-name',
    maxLength: 80,
  },
  {
    key: 'username',
    label: 'Nombre de usuario',
    type: 'text',
    autoComplete: 'username',
    required: true,
    maxLength: 50,
  },
  {
    key: 'email',
    label: 'Correo electrónico',
    type: 'email',
    autoComplete: 'email',
    required: true,
    maxLength: 150,
  },
  {
    key: 'phone',
    label: 'Teléfono',
    type: 'tel',
    autoComplete: 'tel',
    maxLength: 30,
  },
  {
    key: 'birthDate',
    label: 'Fecha de nacimiento',
    type: 'date',
    autoComplete: 'bday',
  },
  
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClass =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 outline-none transition hover:from-purple-700 hover:to-fuchsia-700 focus-visible:ring-4 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60';

function userToForm(user: User): ProfileForm {
  return {
    username: user.username,
    email: user.email,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    biography: user.biography ?? '',
    birthDate: user.birthDate?.slice(0, 10) ?? '',
    timezone: user.timezone,
    languageCode: user.languageCode,
  };
}

export default function EditUser({
  backPath = '/admin',
  loginPath = '/login',
}: EditUserProps) {
  const {
    profile,
    loading,
    error,
    clearError,
    fetchMyProfile,
    editMyProfile,
    uploadAvatar,
    removeAvatar,
    changePassword,
  } = useUsers();

  const [authenticated, setAuthenticated] = useState(
    () =>
      authStorage.isAuthenticated() &&
      Boolean(authStorage.getUser()),
  );

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [initialLoading, setInitialLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );

  const [previewUrl, setPreviewUrl] = useState('');
  const [failedAvatar, setFailedAvatar] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState<Action | null>(null);

  const actionPending = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = loading || action !== null;

  useEffect(() => {
    const checkSession = () => {
      setAuthenticated(
        authStorage.isAuthenticated() &&
          Boolean(authStorage.getUser()),
      );
    };

    window.addEventListener('storage', checkSession);
    window.addEventListener('profile:updated', checkSession);

    return () => {
      window.removeEventListener('storage', checkSession);
      window.removeEventListener(
        'profile:updated',
        checkSession,
      );
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    let active = true;

    setInitialLoading(true);

    const load = async () => {
      const user = await fetchMyProfile();

      if (!active) return;

      if (user) {
        setForm(userToForm(user));
      }

      setInitialLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [authenticated, fetchMyProfile, retry]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(selectedFile);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const resetMessages = () => {
    clearError();
    setLocalError('');
    setSuccess('');
  };

  const changeField = (
    key: keyof ProfileForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    resetMessages();
  };

  /**
   * Evita dobles clics y operaciones simultáneas
   * entre datos, fotografía y contraseña.
   */
  const performAction = async (
    nextAction: Action,
    operation: () => Promise<void>,
  ) => {
    if (actionPending.current || loading) return;

    actionPending.current = true;
    setAction(nextAction);
    resetMessages();

    try {
      await operation();
    } catch {
      setLocalError(
        'Ocurrió un error inesperado. Inténtalo nuevamente.',
      );
    } finally {
      actionPending.current = false;
      setAction(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    resetMessages();

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      clearSelectedFile();

      setLocalError(
        'Selecciona una imagen JPG, PNG o WEBP.',
      );

      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      clearSelectedFile();

      setLocalError(
        'La imagen debe contener datos y no superar los 5 MB.',
      );

      return;
    }

    setFailedAvatar('');
    setSelectedFile(file);

    // Permite volver a seleccionar el mismo archivo.
    event.target.value = '';
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    const file = selectedFile;

    await performAction('avatar', async () => {
      const updated = await uploadAvatar(file);

      if (!updated) return;

      clearSelectedFile();
      setFailedAvatar('');
      setSuccess('Tu fotografía se actualizó correctamente.');
    });
  };

  const handleRemoveAvatar = async () => {
    await performAction('remove', async () => {
      const updated = await removeAvatar();

      if (!updated) return;

      clearSelectedFile();
      setFailedAvatar('');
      setSuccess('Se quitó tu fotografía de perfil.');
    });
  };

  const handleSaveProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await performAction('profile', async () => {
      if (!form.username.trim() || !form.email.trim()) {
        setLocalError(
          'El nombre de usuario y el correo son obligatorios.',
        );
        return;
      }

      if (!form.timezone.trim() || !form.languageCode.trim()) {
        setLocalError(
          'Completa la zona horaria y el código de idioma.',
        );
        return;
      }

      try {
        new Intl.DateTimeFormat('es', {
          timeZone: form.timezone.trim(),
        });
      } catch {
        setLocalError(
          'Zona horaria inválida. Ejemplo: America/La_Paz.',
        );
        return;
      }

      const data: UpdateUser = {
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        biography: form.biography.trim() || null,
        birthDate: form.birthDate || null,
        timezone: form.timezone.trim(),
        languageCode: form.languageCode.trim(),
      };

      const updated = await editMyProfile(data);

      if (!updated) return;

      setForm(userToForm(updated));
      setSuccess('Tus datos se guardaron correctamente.');
    });
  };

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await performAction('password', async () => {
      if (password.length < 8 || password.length > 100) {
        setLocalError(
          'La contraseña debe tener entre 8 y 100 caracteres.',
        );
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden.');
        return;
      }

      const updated = await changePassword({ password });

      if (!updated) return;

      setPassword('');
      setConfirmPassword('');
      setShowPasswords(false);

      setSuccess('Tu contraseña se actualizó correctamente.');
    });
  };

  if (!authenticated) {
    return <Navigate to={loginPath} replace />;
  }

  if (initialLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 px-4">
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-white backdrop-blur-xl"
        >
          <LoaderCircle
            size={22}
            aria-hidden="true"
            className="animate-spin"
          />
          Cargando tu perfil…
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-purple-950">
            No pudimos cargar tu perfil
          </h1>

          <p role="alert" className="mt-4 text-sm text-red-600">
            {error || 'Inténtalo nuevamente.'}
          </p>

          <button
            type="button"
            onClick={() => setRetry((current) => current + 1)}
            className={`${primaryButtonClass} mt-6 w-full`}
          >
            Reintentar
          </button>

          <Link
            to={backPath}
            className="mt-5 block text-center text-sm font-bold text-purple-700"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const fullName =
    [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    profile.username ||
    'Usuario';

  const initials =
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U';

  const avatarSrc = previewUrl || profile.avatarUrl || '';
  const showAvatar = avatarSrc && avatarSrc !== failedAvatar;
  const displayedError = localError || error;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 px-4 py-8 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-fuchsia-400/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-lg">
              <Gift size={26} aria-hidden="true" />
            </div>

            <div>
              <p className="text-lg font-black text-white">
                ChristmasCards
              </p>
              <p className="text-sm text-purple-200">
                Configuración de tu cuenta
              </p>
            </div>
          </div>

          <Link
            to={backPath}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Volver
          </Link>
        </header>

        <div className="grid overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-black/30 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Fotografía y resumen */}
          <aside className="min-w-0 bg-gradient-to-b from-purple-950 to-violet-900 p-6 text-white sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-100">
              <Sparkles size={14} aria-hidden="true" />
              Mi cuenta
            </span>

            <h1 className="mt-5 text-3xl font-black">
              Tu perfil
            </h1>

            <p className="mt-3 text-sm leading-6 text-purple-200">
              Personaliza tu cuenta y comparte un poco de ti.
            </p>

            <div className="mt-8 flex flex-col items-center text-center">
              <div className="relative">
                {showAvatar ? (
                  <img
                    src={avatarSrc}
                    alt={
                      selectedFile
                        ? 'Vista previa de la nueva fotografía'
                        : `Foto de ${fullName}`
                    }
                    onError={() => setFailedAvatar(avatarSrc)}
                    className="h-32 w-32 rounded-3xl object-cover shadow-xl ring-4 ring-white/15"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`Avatar de ${fullName}`}
                    className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-400 to-fuchsia-500 text-4xl font-black shadow-xl ring-4 ring-white/15"
                  >
                    {initials}
                  </div>
                )}

                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 shadow-lg"
                >
                  <Camera size={20} />
                </span>
              </div>

              <h2 className="mt-6 w-full break-words text-xl font-black">
                {fullName}
              </h2>

              <p className="mt-1 w-full break-all text-sm text-purple-200">
                @{profile.username}
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <ShieldCheck size={14} aria-hidden="true" />
                {profile.role === 'admin'
                  ? 'Administrador'
                  : 'Cliente'}
              </span>
            </div>

            <div className="mt-7 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={handleSelectFile}
                aria-label="Seleccionar fotografía de perfil"
                className="hidden"
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-purple-800 outline-none transition hover:bg-purple-50 focus-visible:ring-4 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={17} aria-hidden="true" />
                Seleccionar fotografía
              </button>

              <p className="text-center text-xs leading-5 text-purple-200">
                JPG, PNG o WEBP. Máximo 5 MB.
              </p>

              {selectedFile && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                  <p className="break-all text-xs text-purple-100">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-fuchsia-200">
                    Vista previa · Foto sin guardar
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSaveAvatar}
                    className={`${primaryButtonClass} mt-3 w-full`}
                  >
                    {action === 'avatar' ? (
                      <LoaderCircle
                        size={17}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={17} aria-hidden="true" />
                    )}

                    {action === 'avatar'
                      ? 'Subiendo…'
                      : 'Guardar foto'}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      clearSelectedFile();
                      resetMessages();
                    }}
                    className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-purple-100 hover:bg-white/10 disabled:opacity-60"
                  >
                    <X size={15} aria-hidden="true" />
                    Cancelar selección
                  </button>
                </div>
              )}

              {profile.avatarUrl && !selectedFile && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRemoveAvatar}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-rose-200 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === 'remove' ? (
                    <LoaderCircle
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} aria-hidden="true" />
                  )}

                  {action === 'remove'
                    ? 'Quitando…'
                    : 'Quitar fotografía'}
                </button>
              )}
            </div>
          </aside>

          {/* Datos y contraseña */}
          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <div className="mb-7">
              <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                Información de perfil
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                Hazlo tuyo.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Mantén tus datos actualizados. Los campos con *
                son obligatorios.
              </p>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {displayedError}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                <CheckCircle2
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                />
                {success}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <fieldset disabled={busy} className="min-w-0">
                <legend className="mb-5 flex items-center gap-2 text-lg font-bold text-purple-950">
                  <UserRound size={20} aria-hidden="true" />
                  Datos personales
                </legend>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.key} className="min-w-0">
                      <label
                        htmlFor={`profile-${field.key}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        {field.label}
                        {field.required ? ' *' : ''}
                      </label>

                      <input
                        id={`profile-${field.key}`}
                        name={field.key}
                        type={field.type}
                        value={form[field.key]}
                        required={field.required}
                        maxLength={field.maxLength}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          changeField(
                            field.key,
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />

                      {field.key === 'languageCode' && (
                        <p className="mt-1.5 text-xs text-slate-500">
                          es: español · en: inglés
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="profile-biography"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Biografía
                    </label>

                    <textarea
                      id="profile-biography"
                      name="biography"
                      rows={4}
                      maxLength={500}
                      value={form.biography}
                      onChange={(event) =>
                        changeField(
                          'biography',
                          event.target.value,
                        )
                      }
                      placeholder="Cuéntanos un poco sobre ti…"
                      className={`${inputClass} resize-y`}
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {form.biography.length}/500
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                  >
                    {action === 'profile' ? (
                      <LoaderCircle
                        size={18}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={18} aria-hidden="true" />
                    )}

                    {action === 'profile'
                      ? 'Guardando…'
                      : 'Guardar datos'}
                  </button>
                </div>
              </fieldset>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="mt-9 border-t border-slate-100 pt-8"
            >
              <fieldset disabled={busy} className="min-w-0">
                <legend className="flex items-center gap-2 text-lg font-bold text-purple-950">
                  <LockKeyhole size={20} aria-hidden="true" />
                  Cambiar contraseña
                </legend>

                <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">
                  Usa entre 8 y 100 caracteres. Tu contraseña
                  actual se conserva hasta que guardes una nueva.
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nueva contraseña
                    </label>

                    <input
                      id="new-password"
                      name="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={100}
                      required
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        resetMessages();
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Confirmar contraseña
                    </label>

                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={100}
                      required
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        resetMessages();
                      }}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  aria-pressed={showPasswords}
                  onClick={() =>
                    setShowPasswords((current) => !current)
                  }
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm font-semibold text-purple-700 outline-none hover:text-purple-900 focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  {showPasswords ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}

                  {showPasswords
                    ? 'Ocultar contraseñas'
                    : 'Mostrar contraseñas'}
                </button>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                  >
                    {action === 'password' ? (
                      <LoaderCircle
                        size={18}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <LockKeyhole size={18} aria-hidden="true" />
                    )}

                    {action === 'password'
                      ? 'Actualizando…'
                      : 'Actualizar contraseña'}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}