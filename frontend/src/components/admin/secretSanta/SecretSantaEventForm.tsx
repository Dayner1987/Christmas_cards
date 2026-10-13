import { useState } from 'react';
import type { FormEvent } from 'react';
import { Gift, Loader2, Save } from 'lucide-react';

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

  const pad = (number: number) => String(number).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

export default function SecretSantaEventForm({
  event,
  busy,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    groupId: event?.groupId ?? '',
    name: event?.name ?? '',
    description: event?.description ?? '',
    budget: event?.budget?.toString() ?? '',
    currencyCode: event?.currencyCode ?? 'BOB',
    drawDate: toLocalInput(event?.drawDate ?? null),
    giftDeliveryDate: toLocalInput(event?.giftDeliveryDate ?? null),
  });

  const [error, setError] = useState('');

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (busy) return;

    setError('');

    const groupId = form.groupId.trim();
    const name = form.name.trim();
    const currencyCode = form.currencyCode.trim().toUpperCase();
    const budgetText = form.budget.trim();

    if (!groupId || !name) {
      setError('El grupo y el nombre del evento son obligatorios.');
      return;
    }

    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      setError('Escribe una moneda de tres letras, por ejemplo BOB o USD.');
      return;
    }

    if (
      budgetText &&
      (!Number.isFinite(Number(budgetText)) || Number(budgetText) < 0)
    ) {
      setError('El presupuesto debe ser un número mayor o igual que cero.');
      return;
    }

    const drawDate = form.drawDate ? new Date(form.drawDate) : null;
    const deliveryDate = form.giftDeliveryDate
      ? new Date(form.giftDeliveryDate)
      : null;

    if (
      (drawDate && Number.isNaN(drawDate.getTime())) ||
      (deliveryDate && Number.isNaN(deliveryDate.getTime()))
    ) {
      setError('Revisa las fechas del evento.');
      return;
    }

    if (drawDate && deliveryDate && deliveryDate < drawDate) {
      setError('La entrega no puede ser anterior al sorteo.');
      return;
    }

    // El contrato proporcionado no permite enviar null para borrar estos campos.
    if (
      event &&
      (
        (event.budget !== null && !budgetText) ||
        (event.drawDate && !form.drawDate) ||
        (event.giftDeliveryDate && !form.giftDeliveryDate)
      )
    ) {
      setError(
        'Puedes modificar el presupuesto y las fechas existentes. Para quitarlos, el contrato de actualización debe admitir null.',
      );
      return;
    }

    try {
      await onSave({
        groupId,
        name,
        description: form.description.trim(),
        currencyCode,
        ...(budgetText ? { budget: Number(budgetText) } : {}),
        ...(drawDate ? { drawDate: drawDate.toISOString() } : {}),
        ...(deliveryDate
          ? { giftDeliveryDate: deliveryDate.toISOString() }
          : {}),
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <Modal
      title={event ? 'Editar evento' : 'Crear evento de amigo secreto'}
      busy={busy}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorNotice message={error} />}

        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4">
          <span className="rounded-xl bg-white p-3 text-red-600">
            <Gift className="h-6 w-6" />
          </span>
          <p className="text-sm leading-6 text-red-800">
            Organiza el intercambio, define el presupuesto y prepara
            el sorteo del grupo.
          </p>
        </div>

        <fieldset
          disabled={busy}
          className="grid min-w-0 gap-4 disabled:opacity-60 sm:grid-cols-2"
        >
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Nombre del evento *
            </span>
            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Navidad entre amigos"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              ID del grupo *
            </span>
            <input
              required
              readOnly={Boolean(event)}
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              placeholder="ID del grupo que participará"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none read-only:bg-slate-50 read-only:text-slate-500 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Descripción
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tema del intercambio, lugar o indicaciones..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Presupuesto por regalo
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="100.00"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Moneda *
            </span>
            <input
              required
              maxLength={3}
              value={form.currencyCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  currencyCode: e.target.value.toUpperCase(),
                })
              }
              placeholder="BOB"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Fecha prevista del sorteo
            </span>
            <input
              type="datetime-local"
              value={form.drawDate}
              onChange={(e) => setForm({ ...form, drawDate: e.target.value })}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-red-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Entrega de regalos
            </span>
            <input
              type="datetime-local"
              value={form.giftDeliveryDate}
              onChange={(e) =>
                setForm({ ...form, giftDeliveryDate: e.target.value })
              }
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-red-100"
            />
          </label>
        </fieldset>

        <p className="text-xs leading-5 text-slate-500">
          Las fechas se ingresan en tu hora local. El sorteo se ejecuta
          al pulsar el botón de la ruleta.
        </p>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {busy ? 'Guardando...' : 'Guardar evento'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}