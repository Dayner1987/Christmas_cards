import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiError } from '../../api/http';
import type { ReactNode } from 'react';
import './network.css';
export interface Person {id:string;username:string;firstName?:string;lastName?:string;avatarUrl?:string;biography?:string}
export interface Category {id:string;name:string;active:boolean}
export interface Store {id:string;ownerId?:string;name:string;nit:string;description:string;address:string;facebookUrl:string;tiktokUrl:string;whatsapp:string;logoUrl?:string;qrImageUrl?:string;createdAt?:string}
export interface Product {id:string;name:string;description:string;price:string;imageUrl?:string;active:boolean;categoryId:string;store:Store;category:Category;contactUrl:string}
export function Shell({title,subtitle,children}:{title:string;subtitle?:string;children:ReactNode}) {return <main className="network"><header className="network-heading"><span>CHRISTMASCARDS · CONECTA Y COMPARTE</span><h1>{title}</h1><p>{subtitle}</p><nav><Link to="/tiendas">Tiendas</Link><Link to="/comunidad">Comunidad</Link></nav></header>{children}</main>}
export function useAction(){const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);async function run(fn:()=>Promise<void>,success=''){setBusy(true);setMessage('');try{await fn();setMessage(success);}catch(e){setMessage(getApiError(e));}finally{setBusy(false);}}return {message,setMessage,busy,run};}
export function Notice({text}:{text:string}){return text?<p className="network-notice" role="status">{text}</p>:null}
export function Pager({page,total,onChange}:{page:number;total:number;onChange:(p:number)=>void}){return <div className="network-actions"><button disabled={page===1} onClick={()=>onChange(page-1)}>Anterior</button><span>Página {page}</span><button disabled={page*24>=total} onClick={()=>onChange(page+1)}>Siguiente</button></div>}
export function ProductCard({product:p}:{product:Product}){return <Link className="network-card product-card" to={`/tiendas/productos/${p.id}`}><img src={p.imageUrl} alt={p.name} loading="lazy"/><div><small>{p.store?.name} · {p.category?.name}</small><h3>{p.name}</h3><strong>Bs {Number(p.price).toFixed(2)}</strong><p>Ver producto →</p></div></Link>}
