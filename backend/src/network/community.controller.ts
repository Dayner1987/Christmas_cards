import { Controller, Get, Post, Patch, Delete, Param, ParseUUIDPipe, Query, Req, UseGuards, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Wishlist, WishlistStatus, WishlistVisibility } from '../wishlists/entities/wishlist.entity';
import { WishlistItem } from '../wishlist_items/entities/wishlist_item.entity';
import { Friendship } from './entities';
import { PageQuery } from './dto';
import { NetworkSupport, publicPerson } from './shared';
@Controller('community')
export class CommunityController {
  constructor(private db:DataSource,private support:NetworkSupport){}
  @Get('users') async users(@Query() q:PageQuery) {
    const query=this.db.getRepository(User).createQueryBuilder('u').where('u.status = :s',{s:'active'}).andWhere('u.role = :r',{r:'client'});
    if(q.q) query.andWhere('(u.username ILIKE :q OR u.firstName ILIKE :q OR u.lastName ILIKE :q)',{q:`%${q.q}%`});
    const [users,total]=await query.orderBy('u.createdAt','DESC').addOrderBy('u.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();
    return {items:users.map(publicPerson),total,page:q.page,limit:q.limit};
  }
  @Get('users/:id') async profile(@Param('id',ParseUUIDPipe) id:string) {
    const u=await this.db.getRepository(User).findOneBy({id,status:'active'});
    if(!u || u.role!=='client') throw new NotFoundException('Perfil no disponible.');
    const lists=await this.db.getRepository(Wishlist).find({where:{userId:id,status:WishlistStatus.ACTIVE,visibility:WishlistVisibility.PUBLIC},order:{createdAt:'DESC'},take:30});
    const items=lists.length ? await this.db.getRepository(WishlistItem).find({where:{wishlistId:In(lists.map(l=>l.id)),isReceived:false},order:{createdAt:'DESC'},take:300}):[];
    return {...publicPerson(u),wishlists:lists.map(l=>({id:l.id,name:l.name,items:items.filter(i=>i.wishlistId===l.id).map(i=>({id:i.id,name:i.name,description:i.description,imageUrl:i.imageUrl,productUrl:i.productUrl,productId:i.productId,estimatedPrice:i.estimatedPrice,currencyCode:i.currencyCode}))}))};
  }
  @Get('friends') @UseGuards(JwtAuthGuard) async friends(@Req() req:any) {
    const id=req.user.sub;
    const rows=await this.db.getRepository(Friendship).find({where:[{userA:id},{userB:id}],relations:{first:true,second:true},order:{createdAt:'DESC'},take:1000});
    return rows.filter(f=>f.first.status==='active'&&f.second.status==='active').map(f=>({id:f.id,status:f.status,incoming:f.requesterId!==id,person:publicPerson(f.userA===id?f.second:f.first)}));
  }
  @Post('friends/:userId') @UseGuards(JwtAuthGuard) async request(@Req() req:any,@Param('userId',ParseUUIDPipe) other:string) {
    const id=req.user.sub;
    if(id===other) throw new BadRequestException('No puedes agregarte a ti mismo.');
    const users=await this.db.getRepository(User).findBy({id:In([id,other]),status:'active'});
    if(users.length!==2 || users.some(u=>u.role!=='client')) throw new BadRequestException('Las amistades son entre usuarios de la comunidad.');
    await this.support.limit(`friend:${id}`,30,3600);
    const [userA,userB]=[id,other].sort();
    await this.db.getRepository(Friendship).createQueryBuilder().insert().values({userA,userB,requesterId:id,status:'pending'}).orIgnore().execute();
    return this.db.getRepository(Friendship).findOneByOrFail({userA,userB});
  }
  @Patch('friends/:id/accept') @UseGuards(JwtAuthGuard) async accept(@Req() req:any,@Param('id',ParseUUIDPipe) id:string) {
    const repo=this.db.getRepository(Friendship);const f=await repo.findOneBy({id});
    if(!f)throw new NotFoundException();
    if(![f.userA,f.userB].includes(req.user.sub)||f.requesterId===req.user.sub)throw new ForbiddenException('Solo el destinatario puede aceptar.');
    await repo.update({id,status:'pending'},{status:'accepted'});return {message:'Amistad aceptada.'};
  }
  @Delete('friends/:id') @UseGuards(JwtAuthGuard) async remove(@Req() req:any,@Param('id',ParseUUIDPipe) id:string) {
    const repo=this.db.getRepository(Friendship);const f=await repo.findOneBy({id});
    if(!f)throw new NotFoundException();
    if(![f.userA,f.userB].includes(req.user.sub))throw new ForbiddenException();
    await repo.delete(id);return {message:'Solicitud o amistad eliminada.'};
  }
}
