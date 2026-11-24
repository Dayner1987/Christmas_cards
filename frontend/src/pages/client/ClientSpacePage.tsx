import {Link,useSearchParams} from 'react-router-dom';
import {UserRound,Users,Heart,ShoppingBag,CalendarHeart,Inbox,ArrowUpRight} from 'lucide-react';
import ClientGroups from '../../components/client/ClientGroups';
import ClientWishlist from '../../components/client/ClientWishlist';
import ClientEvents from '../../components/client/ClientEvents';
import ClientMailboxPage from './ClientMailboxPage';
import {useAuth} from '../../hooks/auth.hooks';
const sections=[{id:'groups',label:'Mis grupos',Icon:Users},{id:'wishes',label:'Mis deseos',Icon:Heart},{id:'events',label:'Eventos',Icon:CalendarHeart},{id:'mailbox',label:'Mi buzón',Icon:Inbox}];
export default function ClientSpacePage(){
 const {user}=useAuth();const [params,setParams]=useSearchParams();const selected=sections.some(s=>s.id===params.get('section'))?params.get('section')!:'groups';
 return <div className="personal-space"><section className="space-cover"><div className="space-avatar">{user?.avatarUrl?<img src={user.avatarUrl} alt="Mi fotografía"/>:<UserRound size={40}/>}</div><div className="space-intro"><span>MI ESPACIO PERSONAL</span><h1>{[user?.firstName||user?.username,user?.lastName].filter(Boolean).join(' ')}</h1><p>Tus grupos, deseos, celebraciones y mensajes, juntos.</p></div><Link to="/perfil/editar" className="space-edit">Editar perfil <ArrowUpRight size={17}/></Link></section><nav className="space-tabs" aria-label="Secciones de mi espacio">{sections.map(({id,label,Icon})=><button key={id} aria-pressed={selected===id} className={selected===id?'selected':''} onClick={()=>{const next=new URLSearchParams(params);next.set('section',id);setParams(next);}}><Icon size={19}/>{label}</button>)}</nav><section className="space-content" aria-label={sections.find(s=>s.id===selected)?.label}>{selected==='groups'&&<ClientGroups/>}{selected==='wishes'&&<div id="deseos"><Link className="space-catalog-link" to="/home/products"><ShoppingBagIcon/> Buscar regalos en las tiendas <ArrowUpRight size={17}/></Link><ClientWishlist/></div>}{selected==='events'&&<ClientEvents/>}{selected==='mailbox'&&<ClientMailboxPage embedded/>}</section></div>;
}
function ShoppingBagIcon(){return <ShoppingBag size={18}/>;}
