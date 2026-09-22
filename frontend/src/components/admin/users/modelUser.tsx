import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Camera, Eye, EyeOff, Save, Trash2, Upload } from 'lucide-react';

import type { CreateUser, UpdateUser, User } from '../../../types/user.schema';
import UserModal from './UserModal';

interface UserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  biography: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
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

export default function ModelUser({
  user,
  busy,
  error,
  avatarEnabled,
  onClose,
  onClearError,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
}: ModelUserProps) {
  const editing = Boolean(user);

  const [form, setForm] = useState<UserForm>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    biography: user?.biography ?? '',
    birthDate: user?.birthDate?.slice(0, 10) ?? '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [failedImage, setFailedImage] = useState('');
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [action, setAction] = useState<'save' | 'upload' | 'remove-photo' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionLock = useRef(false);

  const locked = busy || action !== null;
  const avatarSrc = previewUrl || avatarUrl;

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const updateField = (field: keyof UserForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setLocalError('');
  };

  const resetMessages = () => {
    setLocalError('');
    setPhotoMessage('');
    onClearError();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetMessages();
    setConfirmRemovePhoto(false);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!file.size || !validTypes.includes(file.type)) {
      setLocalError('Selecciona una imagen JPG, PNG o WEBP válida.');
      clearSelectedFile();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('La fotografía no puede superar los 5 MB.');
      clearSelectedFile();
      return;
    }

    setFailedImage('');
    setSelectedFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!user || !selectedFile || locked || actionLock.current) return;

    actionLock.current = true;
    setAction('upload');
    resetMessages();

    try {
      const updated = await onUploadAvatar(user.id, selectedFile);
      if (updated) {
        setAvatarUrl(updated.avatarUrl ?? '');
        setFailedImage('');
        clearSelectedFile();
        setPhotoMessage('Fotografía actualizada correctamente.');
      }
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || locked || actionLock.current) return;

    actionLock.current = true;
    setAction('remove-photo');
    resetMessages();

    try {
      const updated = await onRemoveAvatar(user.id);
      if (updated) {
        setAvatarUrl(updated.avatarUrl ?? '');
        setConfirmRemovePhoto(false);
        setPhotoMessage('Fotografía eliminada.');
      }
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (locked || actionLock.current) return;

    resetMessages();

    if (!form.username.trim() || !form.email.trim()) {
      setLocalError('Completa el usuario y el correo.');
      return;
    }

    if (
      (!editing || form.password.length > 0) &&
      (form.password.length < 8 || form.password.length > 100)
    ) {
      setLocalError('La contraseña debe tener entre 8 y 100 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }

    const today = new Date();
    const todayValue = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    if (form.birthDate && form.birthDate > todayValue) {
      setLocalError('La fecha de nacimiento no puede ser futura.');
      return;
    }

    if (selectedFile) {
      setLocalError(
        'Guarda la fotografía seleccionada o cancela su selección antes de guardar los datos.',
      );
      return;
    }

    const common = {
      username: form.username.trim(),
      email: form.email.trim(),
    };

    let payload: CreateUser | UpdateUser;

    if (editing) {
      payload = {
        ...common,
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        biography: form.biography.trim() || null,
        birthDate: form.birthDate || null,
        ...(form.password ? { password: form.password } : {}),
      };
    } else {
      payload = {
        ...common,
        password: form.password,
        ...(form.firstName.trim() ? { firstName: form.firstName.trim() } : {}),
        ...(form.lastName.trim() ? { lastName: form.lastName.trim() } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.biography.trim() ? { biography: form.biography.trim() } : {}),
        ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      };
    }

    actionLock.current = true;
    setAction('save');

    let saved = false;

    try {
      saved = await onSave(payload);
    } finally {
      actionLock.current = false;
      setAction(null);
    }

    if (saved) {
      onClose();
    }
  };

  return (
    <UserModal
      title={editing ? 'Editar usuario' : 'Agregar usuario'}
      busy={locked}
      onClose={onClose}
    >
      <style>{`
        .users-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          color: #1e293b;
          font-family: system-ui, -apple-system, sans-serif;
          max-height: 75vh;
          overflow-y: auto;
          padding-right: 4px;
        }
        .users-muted {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }
        .users-info {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin: 0;
        }
        .users-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin: 0;
        }
        .users-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin: 0;
        }
        .users-photo-section {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .users-photo-preview {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #94a3b8;
        }
        .users-photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .users-photo-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }
        .users-photo-content h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .users-inline-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          margin-top: 0.5rem;
        }
        .users-photo-selection, .users-warning {
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          padding: 0.75rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }
        .users-photo-selection p, .users-warning p {
          margin: 0 0 0.25rem 0;
          font-weight: 500;
        }
        .users-fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }
        .users-fieldset:disabled {
          opacity: 0.7;
        }
        .users-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 580px) {
          .users-form-grid {
            grid-template-columns: 1fr;
          }
        }
        .users-form-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #334155;
        }
        .users-form-grid input,
        .users-form-grid textarea {
          padding: 0.5rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          width: 100%;
        }
        .users-form-grid input:focus,
        .users-form-grid textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }
        .users-full-width {
          grid-column: 1 / -1;
        }
        .users-password-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .users-password-field input {
          padding-right: 2.5rem;
        }
        .users-icon-button {
          position: absolute;
          right: 0.5rem;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .users-icon-button:hover {
          color: #0f172a;
        }
        .users-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }
        .users-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
        }
        .users-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .users-primary {
          background-color: #2563eb;
          color: #ffffff;
        }
        .users-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        .users-secondary {
          background-color: #f1f5f9;
          color: #334155;
        }
        .users-secondary:hover:not(:disabled) {
          background-color: #e2e8f0;
        }
        .users-soft-danger {
          background-color: #fef2f2;
          color: #dc2626;
        }
        .users-soft-danger:hover:not(:disabled) {
          background-color: #fee2e2;
        }
        .users-danger {
          background-color: #dc2626;
          color: #ffffff;
        }
        .users-danger:hover:not(:disabled) {
          background-color: #b91c1c;
        }
      `}</style>

      <div className="users-modal-body">
        <p className="users-muted">
          {editing
            ? 'Actualiza los datos de esta cuenta. Deja la contraseña vacía para conservarla.'
            : 'Completa los datos de la nueva cuenta. Los campos con * son obligatorios.'}
        </p>

        {editing && avatarEnabled && (
          <section
            className="users-photo-section"
            aria-label="Fotografía del usuario"
          >
            <div className="users-photo-preview">
              {avatarSrc && avatarSrc !== failedImage ? (
                <img
                  src={avatarSrc}
                  alt={
                    selectedFile
                      ? 'Vista previa de la fotografía'
                      : `Fotografía de ${user?.username}`
                  }
                  onError={() => setFailedImage(avatarSrc)}
                />
              ) : (
                <span>
                  <Camera size={34} aria-hidden="true" />
                </span>
              )}
            </div>

            <div className="users-photo-content">
              <h3>Fotografía de perfil</h3>
              <p className="users-muted">JPG, PNG o WEBP. Máximo 5 MB.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={locked}
                onChange={handleSelectFile}
              />

              <div className="users-inline-actions">
                <button
                  type="button"
                  className="users-button users-secondary"
                  disabled={locked}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} aria-hidden="true" />
                  Seleccionar foto
                </button>

                {avatarUrl && !selectedFile && (
                  <button
                    type="button"
                    className="users-button users-soft-danger"
                    disabled={locked}
                    onClick={() => {
                      resetMessages();
                      setConfirmRemovePhoto(true);
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Quitar foto
                  </button>
                )}
              </div>

              {selectedFile && (
                <div className="users-photo-selection">
                  <p>{selectedFile.name}</p>
                  <small className="users-muted">
                    Vista previa · Fotografía sin guardar
                  </small>

                  <div className="users-inline-actions">
                    <button
                      type="button"
                      className="users-button users-primary"
                      disabled={locked}
                      onClick={() => void handleUploadAvatar()}
                    >
                      {action === 'upload'
                        ? 'Subiendo…'
                        : 'Guardar fotografía'}
                    </button>

                    <button
                      type="button"
                      className="users-button users-secondary"
                      disabled={locked}
                      onClick={clearSelectedFile}
                    >
                      Cancelar selección
                    </button>
                  </div>
                </div>
              )}

              {confirmRemovePhoto && (
                <div className="users-warning">
                  <p>¿Quieres quitar la fotografía actual?</p>

                  <div className="users-inline-actions">
                    <button
                      type="button"
                      className="users-button users-secondary"
                      disabled={locked}
                      onClick={() => setConfirmRemovePhoto(false)}
                    >
                      Conservar
                    </button>

                    <button
                      type="button"
                      className="users-button users-danger"
                      disabled={locked}
                      onClick={() => void handleRemoveAvatar()}
                    >
                      {action === 'remove-photo'
                        ? 'Quitando…'
                        : 'Sí, quitar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!editing && avatarEnabled && (
          <p className="users-info">
            Después de crear la cuenta, abre Editar para agregar su fotografía.
          </p>
        )}

        {photoMessage && (
          <p className="users-success" role="status">
            {photoMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="users-fieldset" disabled={locked}>
            <div className="users-form-grid">
              <label>
                Nombre de usuario *
                <input
                  autoFocus
                  required
                  autoComplete="off"
                  value={form.username}
                  onChange={(event) =>
                    updateField('username', event.target.value)
                  }
                />
              </label>

              <label>
                Correo electrónico *
                <input
                  required
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(event) =>
                    updateField('email', event.target.value)
                  }
                />
              </label>

              <label>
                Nombres
                <input
                  value={form.firstName}
                  onChange={(event) =>
                    updateField('firstName', event.target.value)
                  }
                />
              </label>

              <label>
                Apellidos
                <input
                  value={form.lastName}
                  onChange={(event) =>
                    updateField('lastName', event.target.value)
                  }
                />
              </label>

              <label>
                Teléfono
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField('phone', event.target.value)
                  }
                />
              </label>

              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    updateField('birthDate', event.target.value)
                  }
                />
              </label>

              <label className="users-full-width">
                Biografía
                <textarea
                  rows={3}
                  value={form.biography}
                  onChange={(event) =>
                    updateField('biography', event.target.value)
                  }
                />
              </label>

              <label>
                {editing ? 'Nueva contraseña' : 'Contraseña *'}
                <span className="users-password-field">
                  <input
                    required={!editing}
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      updateField('password', event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="users-icon-button"
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              <label>
                Confirmar contraseña
                <input
                  required={!editing || Boolean(form.password)}
                  type={showPassword ? 'text' : 'password'}
                  maxLength={100}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField('confirmPassword', event.target.value)
                  }
                />
              </label>
            </div>
          </fieldset>

          {(localError || error) && (
            <p className="users-error" role="alert" style={{ marginTop: '1rem' }}>
              {localError || error}
            </p>
          )}

          <footer className="users-modal-actions">
            <button
              type="button"
              className="users-button users-secondary"
              disabled={locked}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="users-button users-primary"
              disabled={locked}
            >
              <Save size={17} aria-hidden="true" />
              {action === 'save'
                ? 'Guardando…'
                : editing
                ? 'Guardar cambios'
                : 'Crear usuario'}
            </button>
          </footer>
        </form>
      </div>
    </UserModal>
  );
}