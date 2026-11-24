import { isUUID } from 'class-validator';
import { CanActivate, ExecutionContext, Injectable, Controller, Get, Post, Put, Delete, Param, ParseUUIDPipe, Body, Query, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource, In } from 'typeorm';
import { createHash } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Group, GroupStatus } from '../groups/entities/group.entity';
import { GroupMember, MembershipStatus } from '../group_members/entities/group_member.entity';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';
import { imageUploadOptions } from '../cloudinary/image-upload.options';
import { ChatMessage, GroupTree, TreeAsset } from './entities';
import { ChatQuery, MessageDto, TreeDto } from './dto';
import { NetworkSupport } from './shared';
interface Actor {key:string;name:string;avatarUrl:string|null;moderator:boolean}
@Injectable()
export class GroupRoomGuard implements CanActivate {
  constructor(private db:DataSource,private jwt:JwtAuthGuard){}
  async canActivate(context:ExecutionContext){
    const req=context.switchToHttp().getRequest();const groupId=req.params.groupId;
    if(!isUUID(groupId))throw new BadRequestException('Grupo inválido.');
    const group=await this.db.getRepository(Group).findOneBy({id:groupId,status:GroupStatus.ACTIVE});if(!group)throw new NotFoundException('Grupo no disponible.');
    // Guest capability is scoped to this exact group and active membership.
    const token=req.headers['x-guest-token'];let actor:Actor;
    if(typeof token==='string'&&token.length>0){
      if(token.length>512)throw new ForbiddenException();
      const hash=createHash('sha256').update(token).digest('hex');
      const member=await this.db.getRepository(GroupMember).createQueryBuilder('m').where('m.groupId=:groupId AND m.guestAccessHash=:hash AND m.membershipStatus=:s AND m.userId IS NULL',{groupId,hash,s:MembershipStatus.ACTIVE}).getOne();
      if(!member)throw new ForbiddenException('Invitación no disponible para este grupo.');
      actor={key:`g:${member.id}`,name:member.guestName||'Invitado',avatarUrl:member.guestAvatarUrl,moderator:false};
    }else{
      await this.jwt.canActivate(context);
      const user=await this.db.getRepository(User).findOneByOrFail({id:req.user.sub,status:'active'});
      const member=await this.db.getRepository(GroupMember).findOneBy({groupId,userId:user.id,membershipStatus:MembershipStatus.ACTIVE});
      if(group.ownerId!==user.id&&!member)throw new ForbiddenException('Debes ser miembro activo del grupo.');
      actor={key:`u:${user.id}`,name:[user.firstName,user.lastName].filter(Boolean).join(' ')||user.username,avatarUrl:user.avatarUrl,moderator:group.ownerId===user.id||member?.role==='admin'};
    }
    req.roomActor=actor;return true;
  }
}
@Controller('groups/:groupId/room') @UseGuards(GroupRoomGuard)
export class GroupRoomController {
  constructor(private db:DataSource,private cloud:CloudinaryService,private support:NetworkSupport){}
  @Get('messages') async messages(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@Query() q:ChatQuery){
    if(q.before&&q.after)throw new BadRequestException('Usa before o after, no ambos.');
    const qb=this.db.getRepository(ChatMessage).createQueryBuilder('m').where('m.groupId=:groupId',{groupId});
    if(q.before)qb.andWhere('m.id<:cursor',{cursor:q.before});if(q.after)qb.andWhere('m.id>:cursor',{cursor:q.after});
    const items=await qb.orderBy('m.id',q.after?'ASC':'DESC').take(50).getMany();if(!q.after)items.reverse();
    return {items,actor:req.roomActor,hasMore:items.length===50};
  }
  @Post('messages') async send(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@Body() dto:MessageDto){
    const actor:Actor=req.roomActor;const repo=this.db.getRepository(ChatMessage);
    const where={groupId,senderKey:actor.key,clientMessageId:dto.clientMessageId};const previous=await repo.findOneBy(where);if(previous)return previous;
    await this.support.limit(`chat:${groupId}:${actor.key}`,30,60);
    await repo.createQueryBuilder().insert().values({...where,senderName:actor.name,avatarUrl:actor.avatarUrl,text:dto.text}).orIgnore().execute();
    return repo.findOneByOrFail(where);
  }
  @Delete('messages/:id') async remove(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@Param('id') id:string){
    if(!/^\d{1,18}$/.test(id))throw new BadRequestException();
    const repo=this.db.getRepository(ChatMessage);const message=await repo.findOneBy({id,groupId});if(!message)throw new NotFoundException();
    if(message.senderKey!==req.roomActor.key&&!req.roomActor.moderator)throw new ForbiddenException();
    await repo.update({id,groupId},{deleted:true,text:null});return {id,deleted:true};
  }
  private async ensureTree(groupId:string){await this.db.getRepository(GroupTree).createQueryBuilder().insert().values({groupId,elements:[],revision:0}).orIgnore().execute();}
  @Get('tree') async tree(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string){
    await this.ensureTree(groupId);const tree=await this.db.getRepository(GroupTree).findOneByOrFail({groupId});
    const assets=await this.db.getRepository(TreeAsset).findBy({groupId});return {...tree,assets,canChangeBackground:req.roomActor.moderator};
  }
  @Put('tree') async saveTree(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@Body() dto:TreeDto){
    await this.support.limit(`tree:${groupId}:${req.roomActor.key}`,30,60);await this.ensureTree(groupId);
    if(new Set(dto.elements.map(e=>e.id)).size!==dto.elements.length)throw new BadRequestException('Identificadores repetidos.');
    const assets=dto.elements.filter(e=>e.kind==='image').map(e=>e.assetId);
    if(dto.elements.some(e=>e.kind==='image'?!e.assetId:!e.value?.trim()))throw new BadRequestException('Cada adorno necesita contenido.');
    const ids=[...new Set(assets)] as string[];
    if(ids.length && await this.db.getRepository(TreeAsset).countBy({id:In(ids),groupId})!==ids.length)throw new BadRequestException('Imagen ajena al grupo.');
    const result=await this.db.getRepository(GroupTree).createQueryBuilder().update().set({elements:dto.elements,revision:()=> 'revision + 1'}).where('"groupId"=:groupId AND revision=:revision',{groupId,revision:dto.revision}).execute();
    if(!result.affected)throw new ConflictException('Otro integrante modificó el árbol. Recarga la versión reciente antes de guardar.');
    return this.tree(req,groupId);
  }
  @Post('tree/background') @UseInterceptors(FileInterceptor('file',imageUploadOptions))
  async background(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@UploadedFile() file?:Express.Multer.File){
    if(!req.roomActor.moderator)throw new ForbiddenException('Solo el organizador o administrador del grupo cambia el fondo.');
    await this.ensureTree(groupId);const img=await this.cloud.uploadImage(file,IMAGE_FOLDERS.TREES);let old:string|null=null;
    try{await this.db.transaction(async m=>{const row=await m.getRepository(GroupTree).createQueryBuilder('t').addSelect('t.imagePublicId').where('t.groupId=:id',{id:groupId}).setLock('pessimistic_write').getOneOrFail();old=row.imagePublicId;row.imageUrl=img.url;row.imagePublicId=img.publicId;row.revision++;await m.save(row);});await this.support.cleanup(old);return this.tree(req,groupId);}catch(e){await this.support.cleanup(img.publicId);throw e;}
  }
  @Post('tree/assets') @UseInterceptors(FileInterceptor('file',imageUploadOptions))
  async asset(@Req() req:any,@Param('groupId',ParseUUIDPipe) groupId:string,@UploadedFile() file?:Express.Multer.File){
    await this.support.limit(`tree-upload:${groupId}:${req.roomActor.key}`,20,3600);
    if(await this.db.getRepository(TreeAsset).countBy({groupId})>=300)throw new BadRequestException('Límite de imágenes del árbol alcanzado.');
    const img=await this.cloud.uploadImage(file,IMAGE_FOLDERS.TREES);
    try{const saved=await this.db.getRepository(TreeAsset).save({groupId,imageUrl:img.url,publicId:img.publicId});return {id:saved.id,groupId,imageUrl:saved.imageUrl};}catch(e){await this.support.cleanup(img.publicId);throw e;}
  }
}
