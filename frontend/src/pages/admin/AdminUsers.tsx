import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import {
  CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff,
  Gift, LoaderCircle, Pencil, Plus, RefreshCw, Search, ShieldCheck,
  Trash2, TriangleAlert, Upload, UserCheck, Users, X,
} from 'lucide-react';

import { useUsers } from '../../hooks/user.hook';
import { authStorage } from '../../config/auth.storage';

import type {
  CreateUser, UpdateUser, User, UserRole, UserStatus,
} from '../../types/user.schema';

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: User }
  | { type: 'delete'; user: User }
  | null;

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  client: 'Cliente',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
};

const PAGE_SIZE = 10;
const ADMIN_AVATAR_ENABLED = false;

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const getFullName = (user: User) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-BO');
};

function Avatar({
  name, src, large = false,
}: {
  name: string;
  src?: string | null;
  large?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState('');

  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map(part => part.charAt(0)).join('').toUpperCase() || 'U';

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 font-black text-white shadow-sm ${
        large ? 'h-24 w-24 rounded-3xl text-3xl' : 'h-11 w-11 rounded-2xl text-sm'
      }`}
    >
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt={`Fotografía de ${name}`}
          onError={() => setFailedUrl(src)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-label={`Avatar de ${name}`}>{initials}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        status === 'active' ? 'bg-emerald-50 text-emerald-700'
          : status === 'suspended' ? 'bg-amber-50 text-amber-800'
            : status === 'deleted' ? 'bg-rose-50 text-rose-700'
              : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ModalShellProps {
  title: string;
  busy: boolean;
  children: ReactNode;
  onClose: () => void;
}

function ModalShell({ title, busy, children, onClose }: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    dialog?.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl border border-purple-100 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-purple-950/40 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-purple-100 bg-white px-5 py-4 sm:px-7">
        <h2 id={titleId} className="text-xl font-black text-purple-950">{title}</h2>
        <button
          type="button"
          aria-label="Cerrar ventana"
          disabled={busy}
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-purple-700 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={21} aria-hidden="true" />
        </button>
      </header>
      <div className="p-5 sm:p-7">{children}</div>
    </dialog>
  );
}

interface ModelUserProps {
  user: User | null;
  busy: boolean;
  error: string | null;
  avatarEnabled: boolean;
  onClose: () => void;
  onClearError: () => void;
  onSave: (data: CreateUser | UpdateUser) => Promise<boolean>;
  onUploadAvatar: (id: string, file: File) => Promise<User | null>;
  onRemoveAvatar: (id: string) => Promise<User | null>;
}

function ModelUser({
  user, busy, error, avatarEnabled, onClose, onClearError,
  onSave, onUploadAvatar, onRemoveAvatar,
}: ModelUserProps) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    birthDate: user?.birthDate?.slice(0, 10) ?? '',
    biography: user?.biography ?? '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [action, setAction] = useState<'save' | 'upload' | 'remove' | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const disabled = busy || action !== null;

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const changeField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setLocalError('');
  };

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resetMessages = () => {
    setLocalError('');
    setPhotoMessage('');
    onClearError();
  };

  const savePhoto = async (remove = false) => {
    if (!user || disabled || lock.current || (!remove && !file)) return;

    lock.current = true;
    setAction(remove ? 'remove' : 'upload');
    resetMessages();

    try {
      const result = remove
        ? await onRemoveAvatar(user.id)
        : await onUploadAvatar(user.id, file!);

      if (result) {
        setAvatarUrl(result.avatarUrl ?? '');
        clearFile();
        setConfirmRemove(false);
        setPhotoMessage(remove ? 'Fotografía eliminada.' : 'Fotografía actualizada.');
      }
    } catch {
      setLocalError('No se pudo actualizar la fotografía. Intenta nuevamente.');
    } finally {
      lock.current = false;
      setAction(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || lock.current) return;

    resetMessages();

    if (!form.username.trim() || !form.email.trim()) {
      setLocalError('Completa el usuario y el correo electrónico.');
      return;
    }
    if ((!user || form.password) && (form.password.length < 8 || form.password.length > 100)) {
      setLocalError('La contraseña debe tener entre 8 y 100 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (form.birthDate && form.birthDate > todayValue) {
      setLocalError('La fecha de nacimiento no puede ser futura.');
      return;
    }
    if (file) {
      setLocalError('Guarda la fotografía o cancela su selección antes de guardar los datos.');
      return;
    }

    const common = { username: form.username.trim(), email: form.email.trim() };

    const payload: CreateUser | UpdateUser = user
      ? {
          ...common,
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
          phone: form.phone.trim() || null,
          biography: form.biography.trim() || null,
          birthDate: form.birthDate || null,
          ...(form.password ? { password: form.password } : {}),
        }
      : {
          ...common,
          password: form.password,
          ...(form.firstName.trim() ? { firstName: form.firstName.trim() } : {}),
          ...(form.lastName.trim() ? { lastName: form.lastName.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.biography.trim() ? { biography: form.biography.trim() } : {}),
          ...(form.birthDate ? { birthDate: form.birthDate } : {}),
        };

    lock.current = true;
    setAction('save');
    let saved = false;

    try {
      saved = await onSave(payload);
    } catch {
      setLocalError('No se pudieron guardar los datos. Intenta nuevamente.');
    } finally {
      lock.current = false;
      setAction(null);
    }

    if (saved) onClose();
  };

  return (
    <ModalShell title={user ? 'Editar usuario' : 'Agregar usuario'} busy={disabled} onClose={onClose}>
      <p className="mb-6 text-sm leading-6 text-slate-500">
        {user
          ? 'Actualiza la información. Deja la contraseña vacía para conservar la actual.'
          : 'Completa la información de la nueva cuenta. Los campos con * son obligatorios.'}
      </p>

      {user && avatarEnabled && (
        <section aria-label="Fotografía del usuario" className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Avatar name={getFullName(user)} src={preview || avatarUrl} large />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-purple-950">Fotografía de perfil</h3>
              <p className="mb-3 mt-1 text-xs text-slate-500">JPG, PNG o WEBP · Máximo 5 MB</p>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={disabled}
                onChange={event => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  resetMessages();
                  setConfirmRemove(false);

                  if (!selected.size || !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
                    setLocalError('Selecciona una imagen JPG, PNG o WEBP válida.');
                    clearFile();
                    return;
                  }
                  if (selected.size > 5 * 1024 * 1024) {
                    setLocalError('La fotografía no puede superar los 5 MB.');
                    clearFile();
                    return;
                  }
                  setFile(selected);
                }}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  <Upload size={16} aria-hidden="true" /> Seleccionar foto
                </button>

                {avatarUrl && !file && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setConfirmRemove(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
                  >
                    <Trash2 size={16} aria-hidden="true" /> Quitar
                  </button>
                )}
              </div>

              {file && (
                <div className="mt-3">
                  <p className="break-all text-xs text-purple-700">{file.name} · Sin guardar</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void savePhoto()}
                      className="min-h-11 rounded-xl bg-purple-700 px-3 py-2 text-sm font-bold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                    >
                      {action === 'upload' ? 'Subiendo…' : 'Guardar fotografía'}
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={clearFile}
                      className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                    >
                      Cancelar selección
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {confirmRemove && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-800">¿Quieres quitar la fotografía actual?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setConfirmRemove(false)}
                  className="min-h-11 rounded-lg bg-white px-3 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
                >
                  Conservar
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void savePhoto(true)}
                  className="min-h-11 rounded-lg bg-rose-600 px-3 text-sm font-bold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
                >
                  {action === 'remove' ? 'Quitando…' : 'Sí, quitar'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {!user && avatarEnabled && (
        <p className="mb-5 rounded-xl bg-purple-50 p-3 text-sm text-purple-700">
          Crea la cuenta y luego abre Editar para agregar su fotografía.
        </p>
      )}

      {photoMessage && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {photoMessage}
        </p>
      )}

      <form onSubmit={submit}>
        <fieldset disabled={disabled} className="grid min-w-0 grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2">
          {([
            { name: 'username', label: 'Nombre de usuario *', type: 'text', required: true },
            { name: 'email', label: 'Correo electrónico *', type: 'email', required: true },
            { name: 'firstName', label: 'Nombres', type: 'text', required: false },
            { name: 'lastName', label: 'Apellidos', type: 'text', required: false },
            { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
            { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: false },
          ] as const).map(field => (
            <label key={field.name} className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-purple-950">
              {field.label}
              <input
                autoFocus={field.name === 'username'}
                type={field.type}
                required={field.required}
                autoComplete="off"
                value={form[field.name]}
                onChange={event => changeField(field.name, event.target.value)}
                className="min-h-11 w-full min-w-0 rounded-xl border border-purple-200 bg-purple-50/30 px-3 py-2.5 font-normal text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
              />
            </label>
          ))}

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950 sm:col-span-2">
            Biografía
            <textarea
              rows={3}
              value={form.biography}
              onChange={event => changeField('biography', event.target.value)}
              className="w-full resize-y rounded-xl border border-purple-200 bg-purple-50/30 px-3 py-2.5 font-normal text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-purple-950">
            {user ? 'Nueva contraseña' : 'Contraseña *'}
            <span className="relative">
              <input
                required={!user}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                value={form.password}
                onChange={event => changeField('password', event.target.value)}
                className="min-h-11 w-full rounded-xl border border-purple-200 bg-purple-50/30 py-2.5 pl-3 pr-12 font-normal text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(current => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-purple-950">
            Confirmar contraseña
            <input
              required={!user || Boolean(form.password)}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              maxLength={100}
              value={form.confirmPassword}
              onChange={event => changeField('confirmPassword', event.target.value)}
              className="min-h-11 w-full rounded-xl border border-purple-200 bg-purple-50/30 px-3 py-2.5 font-normal text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:opacity-50"
            />
          </label>
        </fieldset>

        {(localError || error) && (
          <p role="alert" className="mt-5 break-words rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {localError || error}
          </p>
        )}

        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-purple-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {action === 'save' && <LoaderCircle size={17} className="motion-safe:animate-spin" />}
            {action === 'save' ? 'Guardando…' : user ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}

function DeleteUserModal({
  user, busy, error, onClose, onConfirm,
}: {
  user: User;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const disabled = busy || submitting;

  const confirm = async () => {
    if (disabled || lock.current) return;
    lock.current = true;
    setSubmitting(true);
    setLocalError('');
    let deleted = false;

    try {
      deleted = await onConfirm();
    } catch {
      setLocalError('No se pudo eliminar el usuario. Intenta nuevamente.');
    } finally {
      lock.current = false;
      setSubmitting(false);
    }

    if (deleted) onClose();
  };

  return (
    <ModalShell title="Eliminar usuario" busy={disabled} onClose={onClose}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <TriangleAlert size={30} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-purple-950">¿Estás seguro de eliminar esta cuenta?</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Verifica que seleccionaste a la persona correcta antes de confirmar.
      </p>
      <div className="my-5 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <Avatar name={getFullName(user)} src={user.avatarUrl} />
        <div className="min-w-0">
          <p className="break-words font-bold text-purple-950">{getFullName(user)}</p>
          <p className="break-all text-sm text-slate-500">{user.email}</p>
          <p className="break-all text-xs text-purple-600">@{user.username}</p>
        </div>
      </div>
      {(localError || error) && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{localError || error}</p>
      )}
      <footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          autoFocus
          type="button"
          disabled={disabled}
          onClick={onClose}
          className="min-h-11 rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void confirm()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {submitting ? <LoaderCircle size={17} className="motion-safe:animate-spin" /> : <Trash2 size={17} />}
          {submitting ? 'Eliminando…' : 'Sí, eliminar usuario'}
        </button>
      </footer>
    </ModalShell>
  );
}

export default function AdminUsers() {
  const [, refreshSession] = useState(0);

  useEffect(() => {
    const refresh = () => refreshSession(value => value + 1);
    window.addEventListener('profile:updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('profile:updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const session = authStorage.getUser();

  if (session?.role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <section className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-2xl">
          <ShieldCheck size={44} className="mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-black text-purple-950">Acceso restringido</h1>
          <p className="mt-3 text-sm text-slate-500">Esta sección requiere una cuenta administradora.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <UsersContent currentUserId={session.id} />
      </div>
    </div>
  );
}

function UsersContent({ currentUserId }: { currentUserId: string }) {
  const {
    users, loading, error, clearError, fetchUsers, addUser, editUser,
    removeUser, uploadUserPhoto, removeUserPhoto,
  } = useUsers();

  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [listFailed, setListFailed] = useState(false);
  const reloadLock = useRef(false);

  const reloadUsers = useCallback(async () => {
    if (reloadLock.current) return;
    reloadLock.current = true;
    setListFailed(false);

    try {
      await fetchUsers();
      setHasLoaded(true);
    } catch {
      setListFailed(true);
    } finally {
      reloadLock.current = false;
    }
  }, [fetchUsers]);

  useEffect(() => { void reloadUsers(); }, [reloadUsers]);

  const filteredUsers = useMemo(() => {
    const search = normalizeText(query.trim());
    return users.filter(user => {
      const text = normalizeText(
        [user.username, user.email, user.firstName, user.lastName, user.phone]
          .filter(Boolean).join(' '),
      );
      return (!roleFilter || user.role === roleFilter)
        && (!statusFilter || user.status === statusFilter)
        && text.includes(search);
    }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }, [users, query, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const waitingForFirstLoad = !hasLoaded && !listFailed;

  const clearFilters = () => {
    setQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const openModal = (next: ModalState) => {
    clearError();
    setNotice('');
    setModal(next);
  };

  const closeModal = () => {
    clearError();
    setModal(null);
  };

  const handleSave = async (data: CreateUser | UpdateUser): Promise<boolean> => {
    if (modal?.type === 'create') {
      if (!data.username || !data.email || !data.password) return false;
      const created = await addUser(data as CreateUser);
      if (!created) return false;
      clearFilters();
      setNotice('Usuario creado correctamente.');
      return true;
    }
    if (modal?.type === 'edit') {
      const updated = await editUser(modal.user.id, data);
      if (!updated) return false;
      setNotice('Información actualizada correctamente.');
      return true;
    }
    return false;
  };

  const handleDelete = async (): Promise<boolean> => {
    if (modal?.type !== 'delete' || modal.user.id === currentUserId) return false;
    const deleted = await removeUser(modal.user.id);
    if (deleted) setNotice('Usuario eliminado correctamente.');
    return deleted;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-3 py-6 sm:px-6 sm:py-8">
      {/* Luces sutiles de fondo en tono suave */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-fuchsia-200/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-700">
              <Gift size={18} aria-hidden="true" /> ChristmasCards · Administración
            </div>
            <h1 className="text-3xl font-black tracking-tight text-purple-950 sm:text-4xl">Usuarios</h1>
            <p className="mt-2 text-sm leading-6 text-purple-800">Gestiona las cuentas y la información de tu comunidad.</p>
          </div>
          <button
            type="button"
            disabled={loading || waitingForFirstLoad}
            onClick={() => openModal({ type: 'create' })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-purple-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={20} aria-hidden="true" /> Agregar usuario
          </button>
        </header>

        <section aria-label="Resumen de usuarios" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            { label: 'Total de usuarios', value: users.length, icon: Users },
            { label: 'Administradores', value: users.filter(user => user.role === 'admin').length, icon: ShieldCheck },
            { label: 'Cuentas activas', value: users.filter(user => user.status === 'active').length, icon: UserCheck },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5 text-slate-800 shadow-sm shadow-purple-500/5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Icon size={24} aria-hidden="true" />
              </span>
              <div className="flex flex-1 items-center justify-between gap-3 sm:block">
                <p className="text-sm font-medium text-purple-800">{label}</p>
                <p className="text-3xl font-black text-purple-950 sm:mt-1">{hasLoaded ? value : '—'}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Notificaciones de éxito / mensajes */}
        {notice && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button type="button" onClick={() => setNotice('')} className="text-emerald-600 hover:text-emerald-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Alertas de error en la página principal */}
        {error && !modal && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
            <div className="flex items-center gap-2">
              <TriangleAlert size={18} className="text-rose-600" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={clearError} className="text-rose-600 hover:text-rose-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario, correo o teléfono..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="min-h-11 w-full rounded-2xl border border-purple-100 bg-white pl-10 pr-8 text-sm font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="min-h-11 rounded-2xl border border-purple-100 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="client">Cliente</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="min-h-11 rounded-2xl border border-purple-100 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
              <option value="deleted">Eliminado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(query || roleFilter || statusFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 rounded-2xl border border-purple-200 bg-white px-4 text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                Limpiar filtros
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => void reloadUsers()}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-purple-100 bg-white px-4 text-sm font-bold text-purple-700 shadow-sm hover:bg-purple-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-xl shadow-purple-500/5">
          {waitingForFirstLoad ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <LoaderCircle size={36} className="animate-spin text-purple-600" />
              <p className="mt-4 text-sm font-medium text-slate-600">Cargando usuarios...</p>
            </div>
          ) : listFailed ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TriangleAlert size={40} className="text-rose-500" />
              <p className="mt-3 font-bold text-slate-800">No se pudieron cargar los usuarios</p>
              <p className="mt-1 text-sm text-slate-500">Ocurrió un problema al obtener los datos.</p>
              <button
                type="button"
                onClick={() => void reloadUsers()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-purple-300" />
              <p className="mt-3 font-bold text-slate-800">No se encontraron usuarios</p>
              <p className="mt-1 text-sm text-slate-500">
                {query || roleFilter || statusFilter
                  ? 'Intenta cambiar o limpiar los filtros aplicados.'
                  : 'Aún no hay usuarios registrados.'}
              </p>
              {(query || roleFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-bold text-purple-700 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-purple-100 bg-purple-50/50 text-xs uppercase text-purple-900">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-extrabold">Usuario</th>
                    <th scope="col" className="px-6 py-4 font-extrabold">Rol</th>
                    <th scope="col" className="px-6 py-4 font-extrabold">Estado</th>
                    <th scope="col" className="px-6 py-4 font-extrabold">Registro</th>
                    <th scope="col" className="px-6 py-4 text-right font-extrabold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {visibleUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    return (
                      <tr key={user.id} className="transition hover:bg-purple-50/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={getFullName(user)} src={user.avatarUrl} />
                            <div className="min-w-0">
                              <p className="font-bold text-purple-950">
                                {getFullName(user)}
                                {isSelf && (
                                  <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                                    Tú
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                              <p className="text-xs text-purple-600">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {ROLE_LABELS[user.role] || user.role}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openModal({ type: 'edit', user })}
                              aria-label={`Editar ${user.username}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-purple-700 transition hover:bg-purple-100"
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => openModal({ type: 'delete', user })}
                              aria-label={`Eliminar ${user.username}`}
                              title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-purple-100 px-6 py-4 sm:flex-row">
              <p className="text-xs font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}</span> a{' '}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
                </span>{' '}
                de <span className="font-bold text-slate-700">{filteredUsers.length}</span> usuarios
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 text-xs font-bold text-purple-950">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modales */}
        {(modal?.type === 'create' || modal?.type === 'edit') && (
          <ModelUser
            user={modal.type === 'edit' ? modal.user : null}
            busy={loading}
            error={error}
            avatarEnabled={ADMIN_AVATAR_ENABLED}
            onClose={closeModal}
            onClearError={clearError}
            onSave={handleSave}
            onUploadAvatar={uploadUserPhoto}
            onRemoveAvatar={removeUserPhoto}
          />
        )}

        {modal?.type === 'delete' && (
          <DeleteUserModal
            user={modal.user}
            busy={loading}
            error={error}
            onClose={closeModal}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </main>
  );
}