import { useRef, useState } from 'react';
import { TriangleAlert, Trash2 } from 'lucide-react';

import type { User } from '../../../types/user.schema';
import UserModal from './UserModal';

interface DeleteUserModalProps {
  user: User;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export default function DeleteUserModal({
  user,
  busy,
  error,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const disabled = busy || submitting;

  const handleDelete = async () => {
    if (disabled || lock.current) return;

    lock.current = true;
    setSubmitting(true);

    let deleted = false;

    try {
      deleted = await onConfirm();
    } finally {
      lock.current = false;
      setSubmitting(false);
    }

    if (deleted) {
      onClose();
    }
  };

  return (
    <UserModal
      title="Eliminar usuario"
      busy={disabled}
      onClose={onClose}
    >
      <style>{`
        .users-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          color: #1e293b;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .users-delete-symbol {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #fef2f2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .users-modal-body h3 {
          margin: 0;
          text-align: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f172a;
        }
        .users-delete-account {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: center;
        }
        .users-delete-account strong {
          color: #0f172a;
          font-size: 1rem;
        }
        .users-delete-account span {
          color: #64748b;
          font-size: 0.875rem;
        }
        .users-muted {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.4;
          margin: 0;
          text-align: center;
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
        .users-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .users-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
        }
        .users-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .users-secondary {
          background-color: #f1f5f9;
          color: #334155;
        }
        .users-secondary:hover:not(:disabled) {
          background-color: #e2e8f0;
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
        <div className="users-delete-symbol">
          <TriangleAlert size={30} aria-hidden="true" />
        </div>

        <h3>¿Estás seguro de eliminar esta cuenta?</h3>

        <div className="users-delete-account">
          <strong>
            {[user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || user.username}
          </strong>

          <span>@{user.username}</span>
          <span>{user.email}</span>
        </div>

        <p className="users-muted">
          Se enviará la solicitud de eliminación de este
          usuario. Verifica que seleccionaste la cuenta
          correcta antes de continuar.
        </p>

        {error && (
          <p className="users-error" role="alert">
            {error}
          </p>
        )}

        <footer className="users-modal-actions">
          <button
            autoFocus
            type="button"
            className="users-button users-secondary"
            disabled={disabled}
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="users-button users-danger"
            disabled={disabled}
            onClick={() => void handleDelete()}
          >
            <Trash2 size={17} aria-hidden="true" />
            {disabled ? 'Eliminando…' : 'Sí, eliminar usuario'}
          </button>
        </footer>
      </div>
    </UserModal>
  );
}