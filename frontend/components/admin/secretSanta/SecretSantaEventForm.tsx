// src/components/admin/secretSanta/SecretSantaEventForm.tsx
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Gift, ImagePlus, Loader2, Save } from 'lucide-react';
import { WishlistModal as Modal, ErrorNotice } from '../wishlists/WishlistUI';
import { getApiError } from '../../../api/http';
import type {
  CreateSecretSantaTemplate, SecretSantaTemplate,
} from '../../../types/secret_santa_templates.schema';
import {
  createSecretSantaTemplate, updateSecretSantaTemplate,
  uploadSecretSantaTemplateImage,
} from '../../../api/secret_santa_events';

interface Props {
  template: SecretSantaTemplate | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

const control = 'w-full min-w-0 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100';
const MAX_IMAGE = 5 * 1024 * 1024;

export default function SecretSantaEventForm({ template, onClose, onSaved }: Props) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [budget, setBudget] = useState(template?.budget?.toString() ?? '');
  const [currencyCode, setCurrencyCode] = useState(template?.currencyCode ?? 'BOB');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!photo) { setPhotoPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (!name.trim()) { setError('El nombre del evento es obligatorio.'); return; }
    const amount = budget.trim() ? Number(budget) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      setError('El presupuesto debe ser un valor positivo.'); return;
    }
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > MAX_IMAGE)) {
      setError('Utiliza una imagen JPG, PNG o WEBP de máximo 5 MB.'); return;
    }
    const data: CreateSecretSantaTemplate = {
      name: name.trim(), description: description.trim(), currencyCode,
      ...(amount !== undefined ? { budget: amount } : {}),
    };
    setBusy(true);
    try {
      // Conservar el ID en caso de fallo de Cloudinary, evitando duplicados en reintentos.
      const saved = template
        ? await updateSecretSantaTemplate(template.id, data)
        : draftId
          ? await updateSecretSantaTemplate(draftId, data)
          : await createSecretSantaTemplate(data);
      if (!template && !draftId) setDraftId(saved.id);
      if (photo) await uploadSecretSantaTemplateImage(saved.id, photo);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(getApiError(cause));
    } finally { setBusy(false); }
  };

  return (
    <Modal title={template ? 'Editar evento global' : 'Crear evento para todos los grupos'}
      busy={busy} onClose={onClose} wide>
      <form onSubmit={(e) => void submit(e)} className="min-w-0 space-y-5">
        {error && <ErrorNotice message={error} />}
        <div className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          <Gift size={22} className="shrink-0 text-red-600" />
          <p>Este evento estará disponible para todos los organizadores. Cada grupo tendrá su propio sorteo. <strong>No necesitas introducir ningún ID.</strong></p>
        </div>
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          <span>Nombre del evento *</span>
          <input autoFocus required value={name} maxLength={150} onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Amigo Secreto de Navidad" className={control}/>
        </label>
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          <span>Descripción</span>
          <textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles generales de la celebración" className={`${control} resize-y`} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0 space-y-2 text-sm font-semibold text-slate-700">
            <span>Presupuesto orientativo (opcional)</span>
            <input value={budget} onChange={(e) => setBudget(e.target.value)}
              type="number" min="0" step="0.01" placeholder="100.00" className={control}/>
          </label>
          <label className="block min-w-0 space-y-2 text-sm font-semibold text-slate-700">
            <span>Moneda</span>
            <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className={control}>
              <option value="BOB">Bolivianos (BOB)</option><option value="USD">Dólares (USD)</option>
            </select>
          </label>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:items-center">
          <label className="block min-w-0 space-y-2 text-sm font-semibold text-slate-700">
            <span>Fotografía navideña (opcional)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="block w-full min-w-0 cursor-pointer rounded-xl border border-red-200 p-3 text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-red-100 file:px-3 file:py-2 file:font-bold file:text-red-800"/>
            <span className="block text-xs font-normal text-slate-500">Una sola imagen; se compartirá como portada del evento.</span>
          </label>
          <div className="h-36 overflow-hidden rounded-xl bg-red-50">
            {photoPreview || template?.imageUrl ? (
              <img src={photoPreview || template?.imageUrl || ''} alt="Vista previa del evento" className="h-full w-full object-cover"/>
            ) : <div className="flex h-full items-center justify-center gap-2 text-red-400"><ImagePlus size={24}/> Sin imagen</div>}
          </div>
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-red-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold">Cancelar</button>
          <button type="submit" disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
            {busy ? <Loader2 size={17} className="animate-spin"/> : <Save size={17}/>}
            {busy ? 'Guardando...' : 'Guardar evento'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
