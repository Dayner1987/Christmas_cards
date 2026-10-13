
 // src/components/client/ClientGroups.tsx

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Link } from 'react-router-dom';

import {
  ImagePlus,
  Plus,
  QrCode,
  Users,
  X,
  Copy,
} from 'lucide-react';

import {
  createGroup,
  getMyGroups,
  getInvitationQr,
  uploadGroupImage,
} from '../../api/groups';

import { getApiError } from '../../api/http';
import { useAuth } from '../../hooks/auth.hooks';

import type { Group } from '../../types/group.schema';

export default function ClientGroups() {
  const { user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [qr, setQr] = useState<{
    image: string;
    url: string;
  } | null>(null);

  const loadGroups = async () => {
    try {
      setGroups(await getMyGroups());
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || saving) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim(),
        themeColor: '#B91C1C',
        visibility: 'private',
        joinMode: 'link',
        invitationEnabled: true,
      });

      if (image) {
        try {
          await uploadGroupImage(group.id, image);
        } catch (cause) {
          setError(`Grupo creado, pero su portada falló: ${getApiError(cause)}`);
        }
      }

      setName('');
      setDescription('');
      setImage(null);
      setOpen(false);
      setNotice('¡Grupo creado! Ya puedes compartir su invitación.');

      await loadGroups();
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setSaving(false);
    }
  };

  const showQr = async (id: string) => {
    try {
      setError('');
      const result = await getInvitationQr(id);

      setQr({
        image: result.qrDataUrl,
        url: result.invitationUrl,
      });
    } catch (cause) {
      setError(getApiError(cause));
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Enlace copiado correctamente.');
    } catch {
      setError('No se pudo copiar el enlace.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-red-950">
            <Users className="text-red-600" />
            Mis grupos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Reúne a tus amigos y organiza nuevas celebraciones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
        >
          <Plus size={18} />
          Crear grupo
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}

      {open && (
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-4 rounded-3xl border border-red-100 bg-white p-6"
        >
          <h3 className="text-lg font-black text-red-950">
            Nuevo grupo de amigos
          </h3>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder="Ej. Amigos de Navidad"
            required
            className="w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-600"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Cuéntanos sobre tu grupo"
            rows={3}
            className="w-full rounded-xl border border-red-200 px-4 py-3 outline-none focus:border-red-600"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 p-4 text-sm font-semibold text-red-700">
            <ImagePlus size={21} />
            {image ? image.name : 'Agregar fotografía del grupo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          
<div className="flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() => {
      setOpen(false);
      setName('');
      setDescription('');
      setImage(null);
    }}
    disabled={saving}
    className="min-h-12 cursor-pointer rounded-xl border border-red-200 bg-white px-6 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
  >
    Cancelar
  </button>

  <button
    type="submit"
    disabled={saving || !name.trim()}
    className="min-h-12 cursor-pointer rounded-xl bg-red-700 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {saving ? 'Creando grupo...' : 'Guardar grupo'}
  </button>
</div>

        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando grupos...</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.id}
              className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition hover:shadow-lg"
            >
              <div
                className="flex h-40 items-center justify-center bg-red-700 text-white"
                style={{
                  backgroundColor: group.themeColor || '#B91C1C',
                }}
              >
                {group.imageUrl ? (
                  <img
                    src={group.imageUrl}
                    alt={group.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users size={55} strokeWidth={1.4} />
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-red-950">
                    {group.name}
                  </h3>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    {group.ownerId === user?.id ? 'Organizador' : 'Miembro'}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {group.description || 'Un grupo para compartir entre amigos.'}
                </p>
                
                <Link
                to={`/home/groups/${group.id}`}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-800 active:scale-[0.98]"
                >
                <Users size={17} />
                Ver grupo
                </Link>

                <div className="mt-5 flex flex-wrap gap-2">
                  {group.invitationUrl && (
                    <button
                      type="button"
                      onClick={() => void copyLink(group.invitationUrl!)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <Copy size={16} />
                      Copiar invitación
                    </button>
                  )}

                  {group.ownerId === user?.id && (
                    <button
                      type="button"
                      onClick={() => void showQr(group.id)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
                    >
                      <QrCode size={17} />
                      Ver QR
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {groups.length === 0 && (
            <p className="rounded-2xl border border-dashed border-red-200 bg-white p-8 text-sm text-slate-500">
              Todavía no formas parte de ningún grupo.
            </p>
          )}
        </div>
      )}

      {qr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invitación QR"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <button
              type="button"
              onClick={() => setQr(null)}
              aria-label="Cerrar QR"
              className="absolute right-4 top-4 cursor-pointer text-red-700"
            >
              <X size={22} />
            </button>

            <h3 className="text-xl font-black text-red-950">
              Invita a tus amigos
            </h3>

            <img
              src={qr.image}
              alt="Código QR de invitación"
              className="mx-auto my-5 h-60 w-60"
            />

            <p className="break-all text-xs text-slate-500">
              {qr.url}
            </p>

            <a
              href={qr.image}
              download="invitacion-qr.png"
              className="mt-5 inline-flex cursor-pointer rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
            >
              Guardar QR
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
