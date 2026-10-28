
 // src/components/admin/secretSanta/SecretSantaEventForm.tsx
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Gift, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminGroups } from '../../../api/groups';
import type { Group } from '../../../types/group.schema';
import type {
  CreateSecretSantaEvent,
  SecretSantaEvent,
} from '../../../types/secret_santa_events.schema';
import {
  ErrorNotice,
  getErrorMessage,
  WishlistModal as Modal,
} from '../wishlists/WishlistUI';

interface Props {
  event: SecretSantaEvent | null;
  busy: boolean;
  onClose: () => void;
  onSave: (data: CreateSecretSantaEvent) => Promise<void>;
}

function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const control =
  'min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100';

export default function SecretSantaEventForm({ event, busy, onClose, onSave }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    groupId: event?.groupId ?? '',
    name: event?.name ?? '',
    description: event?.description ?? '',
    budget: event?.budget?.toString() ?? '',
    currencyCode: event?.currencyCode ?? 'BOB',
    drawDate: toLocalInput(event?.drawDate ?? null),
    giftDeliveryDate: toLocalInput(event?.giftDeliveryDate ?? null),
  });

  useEffect(() => {
    let active = true;
    getAdminGroups()
      .then((data) => {
        if (!active) return;
        const available = data.filter((group) => group.status === 'active');
        setGroups(available);
        if (!event && available.length === 1) {
          setForm((current) => ({ ...current, groupId: available[0].id }));
        }
      })
      .catch((cause) => {
        if (active) setError(`No pudimos cargar los grupos: ${getErrorMessage(cause)}`);
      })
      .finally(() => { if (active) setLoadingGroups(false); });
    return () => { active = false; };
  }, [event]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || loadingGroups) return;
    setError('');

    if (!form.groupId) {
      setError('Selecciona un grupo de la lista.');
      return;
    }
    if (!form.name.trim()) {
      setError('Escribe el nombre del evento.');
      return;
    }
    const budget = form.budget.trim() ? Number(form.budget) : undefined;
    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) {
      setError('El presupuesto debe ser un número positivo o cero.');
      return;
    }
    const draw = form.drawDate ? new Date(form.drawDate) : null;
    const delivery = form.giftDeliveryDate ? new Date(form.giftDeliveryDate) : null;
    if ((draw && Number.isNaN(draw.getTime())) ||
        (delivery && Number.isNaN(delivery.getTime()))) {
      setError('Revisa las fechas ingresadas.');
      return;
    }
    if (draw && delivery && delivery < draw) {
      setError('La entrega no puede ser anterior al sorteo.');
      return;
    }
    if (event && ((event.budget !== null && budget === undefined) ||
      (event.drawDate && !draw) || (event.giftDeliveryDate && !delivery))) {
      setError('Para borrar un presupuesto o una fecha existente se necesita habilitar valores nulos en el backend.');
      return;
    }
    try {
      await onSave({
        groupId: form.groupId,
        name: form.name.trim(),
        description: form.description.trim(),
        currencyCode: form.currencyCode,
        ...(budget !== undefined ? { budget } : {}),
        ...(draw ? { drawDate: draw.toISOString() } : {}),
        ...(delivery ? { giftDeliveryDate: delivery.toISOString() } : {}),
      });
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  };

  return (
    <Modal title={event ? 'Editar evento' : 'Crear evento de amigo secreto'} busy={busy} onClose={onClose} wide>
      <form onSubmit={submit} className="min-w-0 space-y-5">
        {error && <ErrorNotice message={error} />}
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
          <Gift className="h-6 w-6 shrink-0" />
          <p className="text-sm">Prepara un sorteo para uno de tus grupos. No necesitas copiar ningún ID.</p>
        </div>
        <fieldset disabled={busy || loadingGroups} className="grid min-w-0 gap-4 disabled:opacity-60 sm:grid-cols-2">
          <label className="min-w-0 space-y-2 sm:col-span-2">
            <span className="block text-sm font-semibold">Nombre del evento *</span>
            <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Navidad entre amigos" className={control} />
          </label>

          <label className="min-w-0 space-y-2 sm:col-span-2">
            <span className="block text-sm font-semibold">Grupo participante *</span>
            <select required value={form.groupId} disabled={Boolean(event) || loadingGroups}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })} className={control}>
              <option value="">{loadingGroups ? 'Cargando grupos...' : 'Selecciona el grupo por su nombre'}</option>
              {groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
              {event?.groupId && !groups.some((group) => group.id === event.groupId) &&
                <option value={event.groupId}>Grupo del evento (no disponible)</option>}
            </select>
            {!loadingGroups && groups.length === 0 &&
              <p className="text-xs text-amber-800">No hay grupos activos. <Link to="/admin/groups" className="font-bold underline">Ir a grupos</Link></p>}
          </label>

          <label className="min-w-0 space-y-2 sm:col-span-2">
            <span className="block text-sm font-semibold">Descripción</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Lugar, tema o indicaciones del intercambio" className={`${control} resize-y`} />
          </label>

          <label className="min-w-0 space-y-2">
            <span className="block text-sm font-semibold">Presupuesto (opcional)</span>
            <input type="number" min="0" step="0.01" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="100.00" className={control} />
          </label>
          <label className="min-w-0 space-y-2">
            <span className="block text-sm font-semibold">Moneda</span>
            <select value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })} className={control}>
              <option value="BOB">Bolivianos (BOB)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </label>
          <label className="min-w-0 space-y-2">
            <span className="block text-sm font-semibold">Fecha del sorteo</span>
            <input type="datetime-local" value={form.drawDate} onChange={(e) => setForm({ ...form, drawDate: e.target.value })} className={control} />
          </label>
          <label className="min-w-0 space-y-2">
            <span className="block text-sm font-semibold">Entrega de regalos</span>
            <input type="datetime-local" value={form.giftDeliveryDate}
              onChange={(e) => setForm({ ...form, giftDeliveryDate: e.target.value })} className={control} />
          </label>
        </fieldset>
        <p className="text-xs text-slate-500">Las fechas se ingresan en tu hora local. El sorteo se inicia desde la ruleta.</p>
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={busy || loadingGroups || groups.length === 0 && !event}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {busy ? 'Guardando...' : 'Guardar evento'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
