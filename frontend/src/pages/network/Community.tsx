import PublicProfileHeader from '../../components/profile/PublicProfileHeader';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Heart, UserRound, Users } from 'lucide-react';
import { api, getApiError } from '../../api/http';
import { authStorage } from '../../config/auth.storage';
import { Shell, Notice, Pager, useAction } from './shared';
import type { Person } from './shared';

type Friendship = { id: string; status: 'pending' | 'accepted'; incoming: boolean; person: Person };
type PublicWishItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  estimatedPrice?: string | null;
  currencyCode?: string;
  productId?: string | null;
  productUrl?: string | null;
};
type PublicList = { id: string; name?: string; title?: string; items: PublicWishItem[] };
type PublicProfile = Person & { wishlists?: PublicList[] };

function displayName(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim() || person.username || 'Usuario';
}

export default function Community() {
  const { userId } = useParams();
  const user = authStorage.getUser();
  const [people, setPeople] = useState<Person[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const action = useAction();

  async function loadRelations() {
    if (user?.role === 'client') {
      const { data } = await api.get<Friendship[]>('/community/friends');
      setFriends(data);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProfile(null);
    setPeople([]);
    setLists([]);
    action.setMessage('');

    (async () => {
      try {
        if (userId) {
          const { data } = await api.get<PublicProfile>(`/community/users/${userId}`);
          if (!active) return;
          setProfile(data);
          setLists(data.wishlists ?? []);
        } else {
          const { data } = await api.get<{ items: Person[]; total: number }>('/community/users', {
            params: { q: query || undefined, page, limit: 24 },
          });
          if (!active) return;
          setPeople(data.items);
          setTotal(data.total);
        }
        if (user?.role === 'client') {
          const { data } = await api.get<Friendship[]>('/community/friends');
          if (active) setFriends(data);
        }
      } catch (cause) {
        if (active) action.setMessage(getApiError(cause));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [userId, query, page]);

  function friendshipActions(person: Person) {
    if (user?.role !== 'client' || user.id === person.id) return null;
    const friendship = friends.find((item) => item.person.id === person.id);
    if (!friendship) {
      return <button disabled={action.busy} onClick={() => action.run(async () => { await api.post(`/community/friends/${person.id}`); await loadRelations(); }, 'Solicitud de amistad enviada.')}>Agregar amigo</button>;
    }
    return <div className="network-actions">
      {friendship.status === 'accepted' ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">✓ Ya son amigos</span> : <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{friendship.incoming ? 'Solicitud recibida' : 'Solicitud pendiente'}</span>}
      {friendship.status === 'pending' && friendship.incoming && <button className="primary" disabled={action.busy} onClick={() => action.run(async () => { await api.patch(`/community/friends/${friendship.id}/accept`); await loadRelations(); }, 'Ahora son amigos.')}>Aceptar</button>}
      <button disabled={action.busy} onClick={() => action.run(async () => { await api.delete(`/community/friends/${friendship.id}`); await loadRelations(); }, friendship.status === 'accepted' ? 'Amistad eliminada.' : 'Solicitud eliminada.')}>{friendship.status === 'accepted' ? 'Quitar amistad' : friendship.incoming ? 'Rechazar' : 'Cancelar'}</button>
    </div>;
  }

  function personCard(person: Person) {
    const name = displayName(person);
    return <article className="network-card" key={person.id}>
      <div className="flex items-center gap-4">
        {person.avatarUrl ? <img className="avatar" src={person.avatarUrl} alt={`Foto de ${name}`}/> : <div className="avatar grid place-items-center text-2xl text-red-600"><UserRound/></div>}
        <div className="min-w-0"><Link to={`/comunidad/${person.id}`} className="font-black text-red-950 hover:text-red-700">{name}</Link><p className="text-xs text-slate-500">@{person.username}</p></div>
      </div>
      {person.biography && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{person.biography}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/comunidad/${person.id}`} className="text-sm font-bold text-red-700 hover:underline">Ver perfil público →</Link>
        {friendshipActions(person)}
      </div>
    </article>;
  }

  const ownProfile = Boolean(profile && user?.role === 'client' && user.id === profile.id);

  return <Shell
    title={profile ? 'Perfil público' : 'Comunidad'}
    subtitle={profile ? 'Conoce a esta persona y descubre los deseos que decidió compartir.' : 'Encuentra amigos, conoce sus perfiles y descubre los regalos que han compartido. El correo y el teléfono permanecen privados.'}
  >
    <Notice text={action.message}/>
    {loading && <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-500">Cargando comunidad…</p>}

    {userId ? <>
      {profile && <PublicProfileHeader name={displayName(profile)} username={profile.username} avatar={profile.avatarUrl} biography={profile.biography} lists={lists.length} wishes={lists.reduce((sum,l)=>sum+l.items.length,0)}>{ownProfile?<Link className="profile-edit-link" to="/perfil/editar">Editar mi perfil</Link>:friendshipActions(profile)}</PublicProfileHeader>}

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2"><Heart className="text-red-600"/><h2>Listas de deseos públicas</h2></div>
        {lists.map((list) => <section className="network-panel" key={list.id}>
          <h3>{list.name || list.title || 'Mis deseos'}</h3>
          <div className="network-grid mt-4">
            {list.items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-red-100 bg-white">
              <div className="h-40 bg-red-50/60">{item.imageUrl ? <img className="h-full w-full object-contain" src={item.imageUrl} alt={item.name}/> : <div className="grid h-full place-items-center text-red-200"><GiftIconFallback/></div>}</div>
              <div className="p-4">
                {item.productId && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Producto de tienda</span>}
                <h4 className="mt-2 font-bold text-red-950">{item.name}</h4>
                {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                {item.estimatedPrice && <p className="mt-2 text-sm font-black text-red-700">{item.currencyCode || 'BOB'} {item.estimatedPrice}</p>}
                {item.productId ? <Link className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:underline" to={`/tiendas/productos/${item.productId}`}>Ver producto <ArrowUpRight size={14}/></Link> : item.productUrl && <a className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:underline" href={item.productUrl} target="_blank" rel="noopener noreferrer">Ver enlace <ArrowUpRight size={14}/></a>}
              </div>
            </article>)}
          </div>
          {list.items.length === 0 && <p className="text-sm text-slate-500">Esta lista todavía no tiene deseos.</p>}
        </section>)}
        {!loading && !lists.length && <p className="rounded-2xl border border-dashed border-red-200 bg-white p-7 text-sm text-slate-500">No hay listas públicas para mostrar. Si es tu perfil, puedes cambiar la visibilidad de tus listas desde Mi espacio.</p>}
      </section>
    </> : <>
      <div className="network-panel">
        <label>Buscar personas<input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Nombre o nombre de usuario…"/></label>
      </div>
      {friends.length > 0 && <details className="network-panel">
        <summary className="cursor-pointer font-bold text-red-950">Mis amigos y solicitudes ({friends.length})</summary>
        <div className="network-grid mt-4">{friends.map((friendship) => personCard(friendship.person))}</div>
      </details>}
      <div className="mb-3 flex items-center gap-2"><Users className="text-red-600"/><h2>Personas de la comunidad</h2></div>
      <div className="network-grid">{people.map(personCard)}</div>
      {!loading && !people.length && <p className="rounded-2xl border border-dashed border-red-200 bg-white p-7 text-sm text-slate-500">No se encontraron personas con esa búsqueda.</p>}
      <Pager page={page} total={total} onChange={setPage}/>
    </>}
  </Shell>;
}

function GiftIconFallback() {
  return <span aria-hidden="true" className="text-5xl">🎁</span>;
}
