import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { LoaderCircle, Save } from 'lucide-react';

import type {
  CreateGroup, Group, GroupJoinMode, GroupVisibility,
} from '../../../types/group.schema';

import GroupDialog, { groupError } from './GroupDialog';

interface GroupModalProps {
  group: Group | null;
  onClose: () => void;
  onSave: (data: CreateGroup) => Promise<void>;
}

function toLocalInput(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (number: number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function GroupModal({
  group, onClose, onSave,
}: GroupModalProps) {
  const [form, setForm] = useState({
    name: group?.name ?? '',
    description: group?.description ?? '',
    imageUrl: group?.imageUrl ?? '',
    visibility: group?.visibility ?? 'private',
    joinMode: group?.joinMode ?? 'closed',
    maximumMembers: group?.maximumMembers?.toString() ?? '',
    invitationExpiresAt: toLocalInput(group?.invitationExpiresAt ?? null),
    invitationEnabled: group?.invitationEnabled ?? true,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current) return;

    setError('');

    if (!form.name.trim()) {
      setError('El nombre del grupo es obligatorio.');
      return;
    }

    if (form.imageUrl.trim()) {
      try {
        const url = new URL(form.imageUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        setError('La imagen debe tener una URL HTTP o HTTPS válida.');
        return;
      }
    }

    const maximum = form.maximumMembers === '' ? undefined : Number(form.maximumMembers);

    if (maximum !== undefined && (!Number.isSafeInteger(maximum) || maximum < 1)) {
      setError('El máximo de miembros debe ser un número entero mayor que cero.');
      return;
    }

    // Los tipos actuales no permiten enviar null para quitar estos valores.
    if (group?.maximumMembers != null && maximum === undefined) {
      setError('Indica un máximo. El contrato actual no permite quitar un límite existente.');
      return;
    }

    if (group?.invitationExpiresAt && !form.invitationExpiresAt) {
      setError('Indica un vencimiento. El contrato actual no permite quitar una fecha existente.');
      return;
    }

    let expiresAt: string | undefined;

    if (form.invitationExpiresAt) {
      const date = new Date(form.invitationExpiresAt);

      if (Number.isNaN(date.getTime())) {
        setError('La fecha de vencimiento no es válida.');
        return;
      }

      const changed =
        form.invitationExpiresAt !== toLocalInput(group?.invitationExpiresAt ?? null);

      if (changed && date.getTime() <= Date.now()) {
        setError('El nuevo vencimiento debe ser una fecha futura.');
        return;
      }

      expiresAt = changed
        ? date.toISOString()
        : group?.invitationExpiresAt ?? date.toISOString();
    }

    const data: CreateGroup = {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      visibility: form.visibility,
      joinMode: form.joinMode,
      invitationEnabled: form.invitationEnabled,
      ...(maximum !== undefined ? { maximumMembers: maximum } : {}),
      ...(expiresAt ? { invitationExpiresAt: expiresAt } : {}),
    };

    // En creación, omitir campos opcionales vacíos.
    // En edición, una cadena vacía permite solicitar que se borre el texto.
    if (!group) {
      if (!data.description) delete data.description;
      if (!data.imageUrl) delete data.imageUrl;
    }

    lock.current = true;
    setBusy(true);
    let success = false;

    try {
      await onSave(data);
      success = true;
    } catch (cause) {
      setError(groupError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }

    if (success) onClose();
  };

  return (
    <GroupDialog title={group ? 'Editar grupo' : 'Crear grupo'} busy={busy} onClose={onClose}>
      <p className="mb-5 text-sm leading-6 text-slate-500">
        Configura la información del grupo y sus opciones de acceso.
      </p>

      <form onSubmit={submit}>
        <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950 sm:col-span-2">
            Nombre del grupo *
            <input
              autoFocus
              required
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              className="min-h-11 rounded-xl border border-purple-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950 sm:col-span-2">
            Descripción
            <textarea
              rows={3}
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              className="resize-y rounded-xl border border-purple-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950 sm:col-span-2">
            URL de la imagen
            <input
              type="url"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))}
              className="min-h-11 rounded-xl border border-purple-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950">
            Visibilidad
            <select
              value={form.visibility}
              onChange={event => setForm(current => ({ ...current, visibility: event.target.value as GroupVisibility }))}
              className="min-h-11 rounded-xl border border-purple-200 bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="private">Privado</option>
              <option value="public">Público</option>
            </select>
          </label>

         <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950">
  Forma de ingreso

  <select
    value={form.joinMode}
    onChange={event =>
      setForm(current => ({
        ...current,
        joinMode: event.target.value as GroupJoinMode,
      }))
    }
    className="min-h-11 rounded-xl border border-purple-200 bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-purple-300"
  >
    <option value="closed">Cerrado</option>
    <option value="link">Mediante enlace</option>
    <option value="approval">Requiere aprobación</option>
  </select>
</label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950">
            Máximo de miembros
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Sin límite configurado"
              value={form.maximumMembers}
              onChange={event => setForm(current => ({ ...current, maximumMembers: event.target.value }))}
              className="min-h-11 min-w-0 rounded-xl border border-purple-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-purple-300"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-purple-950">
            Vencimiento de invitación
            <input
              type="datetime-local"
              value={form.invitationExpiresAt}
              onChange={event => setForm(current => ({ ...current, invitationExpiresAt: event.target.value }))}
              className="min-h-11 min-w-0 rounded-xl border border-purple-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-purple-300"
            />
            <span className="text-xs font-normal text-slate-500">Hora local de este dispositivo.</span>
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-purple-50 p-4 text-sm font-semibold text-purple-800 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.invitationEnabled}
              onChange={event => setForm(current => ({ ...current, invitationEnabled: event.target.checked }))}
              className="h-5 w-5 accent-purple-700"
            />
            Invitación habilitada
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
        )}

        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-purple-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {busy ? <LoaderCircle size={17} className="motion-safe:animate-spin" /> : <Save size={17} />}
            {busy ? 'Guardando…' : group ? 'Guardar cambios' : 'Crear grupo'}
          </button>
        </footer>
      </form>
    </GroupDialog>
  );
}