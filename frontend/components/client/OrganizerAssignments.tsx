
 // src/components/client/OrganizerAssignments.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
} from 'lucide-react';

import {
  getOrganizerAssignments,
} from '../../api/secret_santa_assignments';

import type {
  OrganizerAssignmentsResponse,
} from '../../api/secret_santa_assignments';

import { getApiError } from '../../api/http';

interface Props {
  eventId: string;
  groupId: string;
}

export default function OrganizerAssignments({
  eventId,
  groupId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] =
    useState<OrganizerAssignmentsResponse | null>(null);

  const [error, setError] = useState('');

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (data) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getOrganizerAssignments(eventId);

      setData(result);
      setOpen(true);
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 border-t border-red-100 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-red-950">
            Supervisión del sorteo
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Solo el organizador puede consultar todas las parejas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void toggle()}
          disabled={loading}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          {open ? <EyeOff size={17} /> : <Eye size={17} />}

          {loading
            ? 'Consultando...'
            : open
              ? 'Ocultar parejas'
              : 'Ver asignaciones'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {open && data && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
              {data.total} participantes
            </span>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              {data.delivered} entregados
            </span>

            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
              {data.total - data.delivered} pendientes
            </span>
          </div>

          <div className="space-y-3">
            {data.assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="rounded-2xl border border-red-100 bg-[#fff8f5] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700">
                    <Gift size={22} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      Quien entrega
                    </p>

                    <p className="font-black text-red-950">
                      {assignment.giverName}
                    </p>
                  </div>

                  <ArrowRight size={19} className="text-red-600" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      Le regala a
                    </p>

                    <p className="font-black text-red-950">
                      {assignment.receiverName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-red-100 pt-3">
                  {assignment.giftStatus === 'delivered' ? (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={16} />
                      Regalo entregado
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">
                      Pendiente de entrega
                    </span>
                  )}

                  {assignment.receiverMemberId && (
                    <Link
                      to={`/home/groups/${groupId}/members/${assignment.receiverMemberId}`}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-red-700 hover:underline"
                    >
                      Ver deseos del destinatario
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
