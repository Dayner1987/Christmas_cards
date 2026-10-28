// src/components/client/GroupEventSelector.tsx
import { useEffect, useState } from 'react';
import { CalendarHeart, CheckCircle2, Gift } from 'lucide-react';
import {
  applySecretSantaTemplate, getSecretSantaTemplates,
} from '../../api/secret_santa_events';
import { updateGroup, getGroupById } from '../../api/groups';
import { getApiError } from '../../api/http';
import type { Group } from '../../types/group.schema';
import type { SecretSantaEvent } from '../../types/secret_santa_events.schema';
import type { SecretSantaTemplate } from '../../types/secret_santa_templates.schema';

interface Props {
  group: Group;
  events: SecretSantaEvent[];
  onSaved: (group: Group, event?: SecretSantaEvent) => void;
}

export default function GroupEventSelector({ group, events, onSaved }: Props) {
  const [templates, setTemplates] = useState<SecretSantaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(group.selectedEventId ? `event:${group.selectedEventId}` : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSelected(group.selectedEventId ? `event:${group.selectedEventId}` : '');
  }, [group.selectedEventId]);

  useEffect(() => {
    let active = true;
    getSecretSantaTemplates().then((data) => {
      if (active) setTemplates(data);
    }).catch((cause) => { if (active) setError(getApiError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const current = events.find((event) => event.id === group.selectedEventId);
  const save = async () => {
    if (busy || loading) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (selected.startsWith('template:')) {
        const templateId = selected.slice('template:'.length);
        const result = await applySecretSantaTemplate(group.id, templateId);
        const updated = await getGroupById(group.id);
        onSaved({ ...updated, selectedEventId: result.selectedEventId }, result.event);
      } else {
        const eventId = selected.startsWith('event:') ? selected.slice(6) : null;
        const updated = await updateGroup(group.id, { selectedEventId: eventId });
        onSaved(updated);
      }
      setNotice('Celebración seleccionada. Los invitados verán automáticamente el evento del grupo.');
    } catch (cause) { setError(getApiError(cause)); }
    finally { setBusy(false); }
  };

  return (
    <section className="min-w-0 rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-xl font-black text-red-950"><CalendarHeart size={22} className="text-red-600"/> Celebración principal</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">Elige una celebración disponible para tu grupo. Cada grupo tendrá su propio sorteo; tus invitados no necesitarán seleccionar nada.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18}/>{notice}</p>}
      {current && <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-950">
        {current.imageUrl ? <img src={current.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <Gift size={24} className="text-red-600"/>}
        <div><p className="text-xs font-medium text-red-600">Evento actual</p><p className="font-black">{current.name}</p></div>
      </div>}
      <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={loading || busy}
          aria-label="Seleccionar celebración" className="min-h-12 min-w-0 flex-1 rounded-xl border border-red-200 bg-white px-4 text-sm outline-none focus:border-red-500">
          <option value="">Sin evento seleccionado</option>
          {templates.length > 0 && <optgroup label="Eventos disponibles para todos">
            {templates.map((template) => <option key={template.id} value={`template:${template.id}`}>{template.name}</option>)}
          </optgroup>}
          {events.some((event) => event.status !== 'cancelled') && <optgroup label="Eventos que ya tiene este grupo">
            {events.filter((event) => event.status !== 'cancelled').map((event) =>
              <option key={event.id} value={`event:${event.id}`}>{event.name}</option>)}
          </optgroup>}
        </select>
        <button type="button" disabled={busy || loading || selected === (group.selectedEventId ? `event:${group.selectedEventId}` : '')}
          onClick={() => void save()}
          className="min-h-12 cursor-pointer rounded-xl bg-red-700 px-6 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Guardando...' : 'Aplicar al grupo'}
        </button>
      </div>
      {!loading && !templates.length && !events.length &&
        <p className="mt-3 text-sm text-slate-500">El administrador todavía no ha creado eventos globales.</p>}
    </section>
  );
}
