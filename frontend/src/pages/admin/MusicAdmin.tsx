import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { api, getApiError } from '../../api/http';
import { getTracks, trackForm } from '../../api/music';
import type { Track } from '../../api/music';
const field = 'w-full rounded-xl border border-red-200 bg-white p-3';
export default function MusicAdmin() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editing, setEditing] = useState<Track | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('file');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileKey, setFileKey] = useState(0);
  async function refresh() { setTracks(await getTracks(true)); }
  useEffect(() => { refresh().catch(e => setMessage(getApiError(e))).finally(() => setLoading(false)); }, []);
  function clear() { setEditing(null); setTitle(''); setUrl(''); setFile(null); setFileKey(k => k + 1); }
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setMessage('');
    try {
      if (editing && !file && !url.trim()) await api.patch(`/music/${editing.id}`, { title: title.trim() });
      else {
        if (!file && !url.trim()) throw new Error('Selecciona un archivo o un enlace.');
        await api.post(editing ? `/music/${editing.id}/source` : '/music', trackForm(title, file, url));
      }
      clear(); await refresh(); setMessage('Canción guardada.');
    } catch (error) { setMessage(getApiError(error)); } finally { setBusy(false); }
  }
  async function change(track: Track, remove = false) {
    if (busy || (remove && !window.confirm(`¿Eliminar “${track.title}”?`))) return;
    setBusy(true); setMessage('');
    try {
      if (remove) await api.delete(`/music/${track.id}`);
      else await api.patch(`/music/${track.id}`, { active: !track.active });
      if (editing?.id === track.id) clear();
      await refresh(); setMessage(remove ? 'Canción eliminada.' : 'Estado actualizado.');
    } catch (error) { setMessage(getApiError(error)); } finally { setBusy(false); }
  }
  return <div className="flex min-h-screen bg-red-50"><AdminSidebar/><main className="min-w-0 flex-1 space-y-6 p-5 pt-24 lg:p-8">
    <h1 className="text-3xl font-black text-red-950">Música</h1>
    <p>Administra las canciones disponibles en la portada y el área de clientes.</p>
    {message && <p role="status" className="rounded-xl bg-white p-4">{message}</p>}
    <form onSubmit={save} className="max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{editing ? 'Editar canción' : 'Agregar canción'}</h2>
      <label className="block">Título<input className={field} required maxLength={120} value={title} onChange={e => setTitle(e.target.value)}/></label>
      <label className="block">Origen<select className={field} value={source} onChange={e => { setSource(e.target.value); setFile(null); setUrl(''); setFileKey(k => k + 1); }}>
        <option value="file">Archivo MP3 / MP4</option><option value="youtube">Enlace de YouTube</option></select></label>
      {source === 'file' ? <label className="block">Archivo (máximo 25 MB)<input key={fileKey} className={field} type="file" accept=".mp3,.mp4,audio/mpeg,video/mp4" onChange={e => setFile(e.target.files?.[0] || null)}/></label>
        : <label className="block">Enlace<input className={field} type="url" placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)}/></label>}
      {editing && <p className="text-sm text-slate-600">Deja el archivo y el enlace vacíos para conservar la canción actual.</p>}
      <button disabled={busy} className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
      {editing && <button type="button" disabled={busy} onClick={clear} className="ml-3 p-3">Cancelar edición</button>}
    </form>
    {loading ? <p>Cargando canciones…</p> : !tracks.length && <p>Todavía no hay canciones.</p>}
    <div className="grid gap-3 xl:grid-cols-2">{tracks.map(track => <article key={track.id} className="space-y-3 rounded-xl bg-white p-5">
      <h2 className="font-bold">{track.title}</h2><p>{track.kind.toUpperCase()} · {track.active ? 'Activa' : 'Inactiva'}</p>
      <a href={track.url} target="_blank" rel="noreferrer" className="text-red-700 underline">Ver archivo o video</a>
      <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => { clear(); setEditing(track); setTitle(track.title); setSource(track.kind === 'youtube' ? 'youtube' : 'file'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button>
      <button disabled={busy} onClick={() => void change(track)}>{track.active ? 'Desactivar' : 'Activar'}</button>
      <button disabled={busy} onClick={() => void change(track, true)} className="text-red-700">Eliminar</button></div>
    </article>)}</div>
  </main></div>;
}
