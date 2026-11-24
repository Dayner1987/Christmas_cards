import {PhoneField,boliviaPhone,StoreLogo,ImagePicker,SocialIcon} from '../../components/store/StoreMedia';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store as StoreIcon,
  UserRound,
  X,
} from 'lucide-react';

import AdminSidebar from '../../components/admin/AdminSidebar';
import { api, getApiError, imageForm } from '../../api/http';
import { getUsers } from '../../api/users';
import type { User } from '../../types/user.schema';
import type { AuthResponse } from '../../types/auth.schema';
import type { Product, Store } from '../network/shared';

const PAGE_SIZE = 12;

interface StoreRecord extends Store {
  ownerId: string;
  createdAt?: string;
}

interface StorePage {
  items: StoreRecord[];
  total: number;
}

interface ProductPage {
  items: Product[];
  total: number;
}

interface StoreForm {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  whatsapp: string;
  nit: string;
  description: string;
  address: string;
  facebookUrl: string;
  tiktokUrl: string;
}

const emptyForm: StoreForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  whatsapp: '',
  nit: '',
  description: '',
  address: '',
  facebookUrl: '',
  tiktokUrl: '',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isAllowedSocialUrl(value: string, domain: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === domain || url.hostname.endsWith(`.${domain}`)) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  maxLength,
  placeholder,
  pattern,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  pattern?: string;
  help?: string;
}) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        pattern={pattern}
        className="mt-2 min-h-11 w-full rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      />
      {help && <span className="mt-1 block text-xs font-normal text-slate-500">{help}</span>}
    </label>
  );
}

export default function AdminStores() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [detailLogo, setDetailLogo] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    email: string;
    password: string;
    profileWarning: string;
  } | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const ownerById = useMemo(
    () => new Map(owners.map((owner) => [owner.id, owner] as const)),
    [owners],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [storeResult, usersResult, productsResult] = await Promise.all([
        api.get<StorePage>('/admin/stores', {
          params: { page, limit: PAGE_SIZE, q: search || undefined },
        }),
        getUsers().catch(() => [] as User[]),
        api.get<ProductPage>('/admin/products', { params: { page: 1, limit: 1 } }).catch(() => null),
      ]);
      setStores(storeResult.data.items ?? []);
      setTotal(storeResult.data.total ?? 0);
      setOwners(usersResult.filter((user) => user.role === 'store'));
      setProductTotal(productsResult?.data.total ?? null);
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateForm = (key: keyof StoreForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setNotice('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8 || form.password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.');
      return;
    }
    if (form.name.trim().length < 2 || form.username.trim().length < 3) {
      setError('El nombre de la tienda debe tener al menos 2 caracteres y el usuario al menos 3.');
      return;
    }
    if (form.nit.trim() && !/^\d{1,30}$/.test(form.nit.trim())) {
      setError('El NIT debe contener únicamente números.');
      return;
    }
    if (!/^[1-9]\d{7}$/.test(form.whatsapp.trim())) {
      setError('Ingresa los 8 dígitos de WhatsApp; el prefijo +591 ya está incluido.');
      return;
    }
    if (!isAllowedSocialUrl(form.facebookUrl, 'facebook.com')) {
      setError('Facebook debe ser un enlace HTTPS válido de facebook.com.');
      return;
    }
    if (!isAllowedSocialUrl(form.tiktokUrl, 'tiktok.com')) {
      setError('TikTok debe ser un enlace HTTPS válido de tiktok.com.');
      return;
    }
    if (qrFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(qrFile.type) || qrFile.size > 5 * 1024 * 1024)) {
      setError('El QR debe ser JPG, PNG o WEBP y no superar 5 MB.');
      return;
    }

    setSaving(true);
    let profileWarning = '';
    try {
      // El endpoint registra la cuenta y devuelve un token temporal de la tienda.
      // Se usa únicamente para completar el perfil sin reemplazar la sesión del administrador.
      const response = await api.post<AuthResponse>('/stores/register', {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        whatsapp: boliviaPhone(form.whatsapp),
      });

      const temporaryHeaders = {
        Authorization: `Bearer ${response.data.accessToken}`,
      };

      try {
        await api.patch('/stores/me', {
          name: form.name.trim(),
          nit: form.nit.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
          facebookUrl: form.facebookUrl.trim(),
          tiktokUrl: form.tiktokUrl.trim(),
          whatsapp: boliviaPhone(form.whatsapp),
        }, { headers: temporaryHeaders });

        if (logoFile) await api.post('/stores/me/logo', imageForm(logoFile), {headers: temporaryHeaders});
        if (qrFile) {
          await api.post('/stores/me/qr', imageForm(qrFile), {
            headers: temporaryHeaders,
          });
        }
      } catch (cause) {
        profileWarning = `La cuenta se creó, pero algunos datos comerciales no se pudieron guardar: ${getApiError(cause)}. La tienda puede completarlos desde su propio panel.`;
      }

      setCreatedCredentials({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        profileWarning,
      });
      setForm(emptyForm);
      setQrFile(null); setLogoFile(null);
      setCreateOpen(false);
      setNotice(profileWarning ? 'La cuenta de tienda fue creada con datos básicos.' : 'Tienda creada correctamente. El administrador continúa con su sesión.');
      await load();
    } catch (cause) {
      setError(getApiError(cause));
    } finally {
      setSaving(false);
    }
  };

  const openStoreDetails = async (store: StoreRecord) => {
    setSelectedStore(store); setDetailLogo(null);
    setSelectedProducts([]);
    setProductsError('');
    setProductsLoading(true);
    try {
      const { data } = await api.get<ProductPage>('/admin/products', {
        params: { storeId: store.id, page: 1, limit: 50 },
      });
      setSelectedProducts(data.items ?? []);
    } catch (cause) {
      setProductsError(getApiError(cause));
    } finally {
      setProductsLoading(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copiado.`);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  };

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#fff9f7]">
      <AdminSidebar />
      <main className="min-w-0 w-full flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-red-600">
                <Building2 size={15} /> ChristmasCards · Administración
              </p>
              <h1 className="mt-2 text-3xl font-black text-red-950 sm:text-4xl">Tiendas</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">Crea cuentas comerciales, consulta los escaparates públicos y revisa los productos publicados por cada tienda.</p>
            </div>
            <button
              type="button"
              onClick={() => { setCreateOpen((value) => !value); setError(''); }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-800"
            >
              {createOpen ? <X size={17} /> : <Plus size={18} />}
              {createOpen ? 'Cerrar formulario' : 'Crear tienda'}
            </button>
          </header>

          {error && <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</p>}
          {notice && <p role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{notice}</p>}

          {createdCredentials && (
            <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Cuenta creada</p>
                  <h2 className="mt-1 text-xl font-black text-red-950">{createdCredentials.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Guarda estas credenciales y entrégaselas al responsable de la tienda.</p>
                </div>
                <button type="button" onClick={() => setCreatedCredentials(null)} aria-label="Cerrar credenciales" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['Usuario', createdCredentials.username],
                  ['Correo', createdCredentials.email],
                  ['Contraseña temporal', createdCredentials.password],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-red-50/70 p-3">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 break-all font-bold text-red-950">{value}</p>
                    <button type="button" onClick={() => void copyText(value, label)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700"><Copy size={13}/> Copiar</button>
                  </div>
                ))}
              </div>
              {createdCredentials.profileWarning && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{createdCredentials.profileWarning}</p>}
            </section>
          )}

          {createOpen && (
            <form onSubmit={(event) => void createStore(event)} className="space-y-6 rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-600">Nueva cuenta comercial</p>
                <h2 className="mt-1 text-xl font-black text-red-950">Datos de la tienda y acceso al panel</h2>
                <p className="mt-1 text-sm text-slate-500">La tienda se registrará con su propia cuenta. No se cerrará tu sesión de administrador.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Nombre de la tienda" value={form.name} onChange={(v) => updateForm('name', v)} required maxLength={120} />
                <Field label="NIT" value={form.nit} onChange={(v) => updateForm('nit', v)} maxLength={30} pattern="[0-9]{0,30}" />
                <PhoneField value={form.whatsapp} onChange={v=>updateForm('whatsapp',v)}/>
                <Field label="Dirección física" value={form.address} onChange={(v) => updateForm('address', v)} maxLength={500} />
                <Field label="Facebook" value={form.facebookUrl} onChange={(v) => updateForm('facebookUrl', v)} type="url" maxLength={500} placeholder="https://www.facebook.com/tu-tienda" />
                <Field label="TikTok" value={form.tiktokUrl} onChange={(v) => updateForm('tiktokUrl', v)} type="url" maxLength={500} placeholder="https://www.tiktok.com/@tu-tienda" />
              </div>
              <label className="block text-sm font-semibold text-slate-700">Descripción de la tienda
                <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-red-100 px-4 py-3 text-sm font-normal outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" placeholder="Describe brevemente el negocio y lo que ofrece." />
              </label>
              <ImagePicker label="Logo de la tienda" file={logoFile} onChange={setLogoFile}/>
              <label className="block text-sm font-semibold text-slate-700">Imagen QR de la tienda (opcional)
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setQrFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-dashed border-red-200 bg-red-50/40 p-3 text-sm font-normal" />
                <span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG o WEBP; máximo 5 MB.</span>
              </label>

              <div className="border-t border-red-100 pt-5">
                <h3 className="mb-4 font-black text-red-950">Credenciales de acceso de la tienda</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Nombre de usuario" value={form.username} onChange={(v) => updateForm('username', v)} required maxLength={50} />
                  <Field label="Correo electrónico" value={form.email} onChange={(v) => updateForm('email', v)} type="email" required maxLength={150} />
                  <Field label="Contraseña inicial" value={form.password} onChange={(v) => updateForm('password', v)} type="password" required maxLength={72} help="Mínimo 8 caracteres." />
                  <Field label="Confirmar contraseña" value={form.confirmPassword} onChange={(v) => updateForm('confirmPassword', v)} type="password" required maxLength={72} />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" disabled={saving} onClick={() => { setCreateOpen(false); setForm(emptyForm); setQrFile(null); setLogoFile(null); }} className="min-h-11 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-200 hover:bg-red-800 disabled:opacity-50">
                  {saving ? <RefreshCw size={16} className="animate-spin"/> : <Plus size={17}/>} {saving ? 'Creando tienda…' : 'Crear tienda y cuenta'}
                </button>
              </div>
            </form>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><StoreIcon className="text-red-600"/><p className="mt-3 text-sm text-slate-500">Tiendas registradas</p><p className="mt-1 text-3xl font-black text-red-950">{loading ? '…' : total}</p></div>
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><Package className="text-red-600"/><p className="mt-3 text-sm text-slate-500">Productos totales</p><p className="mt-1 text-3xl font-black text-red-950">{loading ? '…' : productTotal ?? '—'}</p></div>
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><UserRound className="text-red-600"/><p className="mt-3 text-sm text-slate-500">Cuentas de tienda activas</p><p className="mt-1 text-3xl font-black text-red-950">{loading ? '…' : owners.length}</p></div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-xl font-black text-red-950">Tiendas registradas</h2><p className="mt-1 text-sm text-slate-500">Selecciona una tienda para revisar su logo y sus productos.</p></div>
              <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Actualizar</button>
            </div>
            <form onSubmit={applySearch} className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o descripción…" className="min-h-11 w-full rounded-xl border border-red-100 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"/></div>
              <button type="submit" className="min-h-11 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800">Buscar</button>
            </form>

            {loading ? <p role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Cargando tiendas…</p> : stores.length === 0 ? <div className="rounded-3xl border border-dashed border-red-200 bg-white p-10 text-center"><StoreIcon className="mx-auto text-red-300" size={38}/><h3 className="mt-3 font-black text-red-950">Todavía no hay tiendas</h3><p className="mt-1 text-sm text-slate-500">Crea la primera cuenta comercial para empezar a publicar productos.</p></div> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {stores.map((store) => {
                  const owner = ownerById.get(store.ownerId);
                  const ownerName = owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.username : 'Cuenta de tienda';
                  return <article key={store.id} className="min-w-0 rounded-3xl border border-red-100 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700"><StoreLogo url={store.logoUrl} name={store.name}/></div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-lg font-black text-red-950">{store.name}</h3><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Publicada</span></div><p className="mt-1 text-sm text-slate-500">{store.description || 'Sin descripción comercial.'}</p></div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="flex min-w-0 items-center gap-2"><UserRound size={15} className="shrink-0 text-red-500"/><span className="truncate">{ownerName}{owner?.email ? ` · ${owner.email}` : ''}</span></p>
                      <p className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-red-500"/><span className="truncate">{store.address || 'Dirección no registrada'}</span></p>
                      <p className="flex items-center gap-2"><span className="font-bold text-red-600">NIT</span><span>{store.nit || 'No registrado'}</span></p>
                      <p className="flex items-center gap-2"><SocialIcon kind="whatsapp"/><span>{store.whatsapp}</span></p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-red-50 pt-4">
                      <span className="text-xs text-slate-400">Registrada: {formatDate(store.createdAt)}</span>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void openStoreDetails(store)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"><Eye size={14}/> Gestionar / ver productos</button>
                        <Link to={`/tiendas/${store.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800">Tienda pública <ArrowUpRight size={14}/></Link>
                      </div>
                    </div>
                  </article>;
                })}
              </div>
            )}

            {total > PAGE_SIZE && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3"><p className="text-xs text-slate-500">Página {page} de {pageCount} · {total} tiendas</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-40"><ChevronLeft size={18}/></button><button type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-40"><ChevronRight size={18}/></button></div></div>}
          </section>

          <aside className="rounded-2xl border border-red-100 bg-white p-4 text-sm"><Link to="/admin/products">Abrir gestión de productos: crear, editar, subir imágenes y publicar →</Link></aside>
        </div>
      </main>

      {selectedStore && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStore(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="store-products-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
          <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-red-600">Detalle de tienda</p><h2 id="store-products-title" className="mt-1 text-2xl font-black text-red-950">{selectedStore.name}</h2><p className="mt-1 text-sm text-slate-500">{selectedStore.address || 'Sin dirección registrada'} · WhatsApp {selectedStore.whatsapp}</p></div><button type="button" onClick={() => setSelectedStore(null)} aria-label="Cerrar detalle" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header>
          <div className="mt-5 flex flex-wrap gap-2"><Link to={`/tiendas/${selectedStore.id}`} onClick={() => setSelectedStore(null)} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white">Abrir tienda pública <ExternalLink size={15}/></Link><Link to="/admin/users" onClick={() => setSelectedStore(null)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700">Ver cuentas de usuarios</Link></div>
          <div className="network"><StoreLogo url={selectedStore.logoUrl} name={selectedStore.name}/><ImagePicker label="Actualizar logo de la tienda" file={detailLogo} onChange={setDetailLogo} disabled={saving}/><button disabled={!detailLogo||saving} onClick={async()=>{if(!detailLogo)return;setSaving(true);try{const {data}=await api.post(`/admin/stores/${selectedStore.id}/logo`,imageForm(detailLogo));setSelectedStore(data);setDetailLogo(null);setProductsError('');await load();}catch(e){setProductsError(getApiError(e));}finally{setSaving(false);}}}>Guardar logo</button><Link className="button primary" to={`/admin/products?storeId=${selectedStore.id}`}>Añadir y editar productos</Link></div><h3 className="mt-7 text-lg font-black text-red-950">Productos de la tienda</h3>
          {productsLoading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Cargando productos…</p> : productsError ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">{productsError}</p> : selectedProducts.length === 0 ? <p className="mt-3 rounded-xl bg-red-50 p-5 text-sm text-slate-600">Esta tienda todavía no tiene productos.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-red-100"><div className="h-36 bg-red-50">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain"/> : <div className="grid h-full place-items-center text-red-300"><Package size={35}/></div>}</div><div className="p-3"><p className="text-xs text-slate-500">{product.category?.name || 'Sin categoría'}</p><h4 className="mt-1 font-bold text-red-950">{product.name}</h4><p className="mt-1 font-black text-red-700">Bs {Number(product.price).toFixed(2)}</p><Link to={`/admin/products?storeId=${selectedStore.id}`} onClick={() => setSelectedStore(null)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline">Gestionar producto <ArrowUpRight size={13}/></Link></div></article>)}</div>}
        </section>
      </div>}
    </div>
  );
}
