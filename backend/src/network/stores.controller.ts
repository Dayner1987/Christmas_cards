import { Controller, Get, Post, Patch, Delete, Body, Query, Param, ParseUUIDPipe, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User, UserRole } from '../users/entities/user.entity';
import { Wishlist, WishlistStatus } from '../wishlists/entities/wishlist.entity';
import { WishlistItem, WishlistItemPriority } from '../wishlist_items/entities/wishlist_item.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IMAGE_FOLDERS } from '../cloudinary/cloudinary.constants';
import { imageUploadOptions } from '../cloudinary/image-upload.options';
import { Store, StoreCategory, StoreProduct } from './entities';
import { CategoryDto, CategoryUpdateDto, PageQuery, ProductQuery, ProductDto, ProductUpdateDto, RegisterStoreDto, StoreUpdateDto, WishProductDto } from './dto';
import { NetworkSupport, socialUrl } from './shared';
@Controller()
export class StoresController {
  constructor(private db:DataSource,private auth:AuthService,private cloud:CloudinaryService,private support:NetworkSupport,private config:ConfigService){}
  private async mine(req:any) {
    if(req.params?.storeId){
      this.admin(req);
      await new ParseUUIDPipe().transform(req.params.storeId,{type:'param',data:'storeId'});
      const store=await this.db.getRepository(Store).findOneBy({id:req.params.storeId});
      if(!store)throw new NotFoundException('Tienda no encontrada.');
      return store;
    }
    if(req.user.role!==UserRole.STORE)throw new ForbiddenException('Esta cuenta no es una tienda.');
    const store=await this.db.getRepository(Store).findOneBy({ownerId:req.user.sub});
    if(!store)throw new NotFoundException('Tienda no encontrada.');return store;
  }
  private admin(req:any){if(req.user.role!==UserRole.ADMIN)throw new ForbiddenException('Solo el administrador puede gestionar otras tiendas.');}
  @Get('admin/stores') @UseGuards(JwtAuthGuard) async adminStores(@Req() req:any,@Query() q:PageQuery){
    this.admin(req);const qb=this.db.getRepository(Store).createQueryBuilder('s');
    if(q.q)qb.where('s.name ILIKE :q',{q:`%${q.q}%`});
    const [items,total]=await qb.orderBy('s.createdAt','DESC').addOrderBy('s.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();return {items,total,page:q.page,limit:q.limit};
  }
  @Get('admin/products') @UseGuards(JwtAuthGuard) async adminProducts(@Req() req:any,@Query() q:ProductQuery){
    this.admin(req);const qb=this.db.getRepository(StoreProduct).createQueryBuilder('p').leftJoinAndSelect('p.store','s').leftJoinAndSelect('p.category','c');
    if(q.q)qb.andWhere('(p.name ILIKE :q OR p.description ILIKE :q)',{q:`%${q.q}%`});
    if(q.storeId)qb.andWhere('p.storeId=:storeId',{storeId:q.storeId});
    if(q.categoryId)qb.andWhere('p.categoryId=:categoryId',{categoryId:q.categoryId});
    const [items,total]=await qb.orderBy('p.createdAt','DESC').addOrderBy('p.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();return {items,total,page:q.page,limit:q.limit};
  }
  private stores() { return this.db.getRepository(Store).createQueryBuilder('s').innerJoin('s.owner','owner').where('s.active = true AND owner.status = :status',{status:'active'}); }
  private products() {return this.db.getRepository(StoreProduct).createQueryBuilder('p').innerJoinAndSelect('p.store','s').innerJoin('s.owner','owner').innerJoinAndSelect('p.category','c').where('p.active=true AND s.active=true AND c.active=true AND owner.status = :status',{status:'active'});}
  @Post('stores/register') async register(@Body() dto:RegisterStoreDto,@Req() req:any) {
    await this.support.limit(`store-register:${req.ip}`,5,3600);
    if(Buffer.byteLength(dto.password)>72)throw new BadRequestException('La contraseña no debe superar 72 bytes.');
    const email=dto.email.toLowerCase();const username=dto.username.trim();
    const passwordHash=await bcrypt.hash(dto.password,10);
    try {
      await this.db.transaction(async m=>{
        const exists=await m.getRepository(User).createQueryBuilder('u').where('LOWER(u.email)=:email OR LOWER(u.username)=:username',{email,username:username.toLowerCase()}).getOne();
        if(exists)throw new ConflictException('Correo o usuario ya registrado.');
        const user=await m.save(User,m.create(User,{email,username,passwordHash,role:UserRole.STORE,status:'active',firstName:dto.name.slice(0,80)}));
        await m.save(Store,m.create(Store,{ownerId:user.id,name:dto.name,whatsapp:dto.whatsapp,active:true}));
      });
    }catch(e){if((e as {code?:string}).code==='23505')throw new ConflictException('Correo o usuario ya registrado.');throw e;}
    return this.auth.login({identifier:email,password:dto.password});
  }
  @Get('stores') async list(@Query() q:PageQuery) {
    const qb=this.stores();if(q.q)qb.andWhere('(s.name ILIKE :q OR s.description ILIKE :q)',{q:`%${q.q}%`});
    const [items,total]=await qb.orderBy('s.createdAt','DESC').addOrderBy('s.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();return {items,total,page:q.page,limit:q.limit};
  }
  @Get(['stores/me','admin/stores/:storeId']) @UseGuards(JwtAuthGuard) me(@Req() req:any){return this.mine(req);}
  @Patch(['stores/me','admin/stores/:storeId']) @UseGuards(JwtAuthGuard) async update(@Req() req:any,@Body() dto:StoreUpdateDto){
    const s=await this.mine(req);
    if(dto.facebookUrl!==undefined)dto.facebookUrl=socialUrl(dto.facebookUrl,'facebook.com');
    if(dto.tiktokUrl!==undefined)dto.tiktokUrl=socialUrl(dto.tiktokUrl,'tiktok.com');
    return this.db.getRepository(Store).save(Object.assign(s,dto));
  }
  @Get(['stores/me/categories','admin/stores/:storeId/categories']) @UseGuards(JwtAuthGuard) async myCategories(@Req() req:any){const s=await this.mine(req);return this.db.getRepository(StoreCategory).find({where:{storeId:s.id},order:{name:'ASC'}});}
  @Post(['stores/me/categories','admin/stores/:storeId/categories']) @UseGuards(JwtAuthGuard) async createCategory(@Req() req:any,@Body() dto:CategoryDto){
    const s=await this.mine(req);try{return await this.db.getRepository(StoreCategory).save({storeId:s.id,name:dto.name,active:dto.active??true});}catch(e){if((e as any).code==='23505')throw new ConflictException('Ya existe esa categoría.');throw e;}
  }
  @Patch(['stores/me/categories/:id','admin/stores/:storeId/categories/:id']) @UseGuards(JwtAuthGuard) async editCategory(@Req() req:any,@Param('id',ParseUUIDPipe) id:string,@Body() dto:CategoryUpdateDto){
    const s=await this.mine(req);const repo=this.db.getRepository(StoreCategory);const c=await repo.findOneBy({id,storeId:s.id});if(!c)throw new NotFoundException();
    try{return await repo.save(Object.assign(c,dto));}catch(e){if((e as any).code==='23505')throw new ConflictException('Ya existe esa categoría.');throw e;}
  }
  @Delete(['stores/me/categories/:id','admin/stores/:storeId/categories/:id']) @UseGuards(JwtAuthGuard) async archiveCategory(@Req() req:any,@Param('id',ParseUUIDPipe) id:string){return this.editCategory(req,id,{active:false});}
  @Get(['stores/me/products','admin/stores/:storeId/products']) @UseGuards(JwtAuthGuard) async myProducts(@Req() req:any,@Query() q:PageQuery){
    const s=await this.mine(req);const qb=this.db.getRepository(StoreProduct).createQueryBuilder('p').leftJoinAndSelect('p.category','c').where('p.storeId=:id',{id:s.id});
    if(q.q)qb.andWhere('p.name ILIKE :q',{q:`%${q.q}%`});
    const [items,total]=await qb.orderBy('p.createdAt','DESC').addOrderBy('p.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();return {items,total,page:q.page,limit:q.limit};
  }
  @Post(['stores/me/products','admin/stores/:storeId/products']) @UseGuards(JwtAuthGuard) async createProduct(@Req() req:any,@Body() dto:ProductDto){
    const s=await this.mine(req);await this.category(s.id,dto.categoryId);
    if(dto.active)throw new BadRequestException('Guarda el borrador y sube su imagen antes de publicar.');
    return this.db.getRepository(StoreProduct).save({storeId:s.id,categoryId:dto.categoryId,name:dto.name,description:dto.description??'',price:dto.price,active:false});
  }
  private async category(storeId:string,id:string){const c=await this.db.getRepository(StoreCategory).findOneBy({id,storeId,active:true});if(!c)throw new BadRequestException('La categoría debe estar activa y pertenecer a tu tienda.');return c;}
  @Patch(['stores/me/products/:id','admin/stores/:storeId/products/:id']) @UseGuards(JwtAuthGuard) async updateProduct(@Req() req:any,@Param('id',ParseUUIDPipe) id:string,@Body() dto:ProductUpdateDto){
    const s=await this.mine(req);
    return this.db.transaction(async m=>{
      const p=await m.findOne(StoreProduct,{where:{id,storeId:s.id},lock:{mode:'pessimistic_write'}});if(!p)throw new NotFoundException();
      if(dto.categoryId!==undefined||dto.active===true)await this.category(s.id,dto.categoryId??p.categoryId);
      if(dto.active===true&&!p.imageUrl)throw new BadRequestException('Sube la imagen principal antes de publicar.');
      return m.save(StoreProduct,Object.assign(p,dto));
    });
  }
  @Delete(['stores/me/products/:id','admin/stores/:storeId/products/:id']) @UseGuards(JwtAuthGuard) archiveProduct(@Req() req:any,@Param('id',ParseUUIDPipe) id:string){return this.updateProduct(req,id,{active:false});}
  @Post(['stores/me/products/:id/image','admin/stores/:storeId/products/:id/image']) @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file',imageUploadOptions))
  async productImage(@Req() req:any,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file?:Express.Multer.File){
    const s=await this.mine(req);if(!await this.db.getRepository(StoreProduct).existsBy({id,storeId:s.id}))throw new NotFoundException();
    const image=await this.cloud.uploadImage(file,IMAGE_FOLDERS.PRODUCTS);let old:string|null=null;
    try{const saved=await this.db.transaction(async m=>{
      const p=await m.getRepository(StoreProduct).createQueryBuilder('p').addSelect('p.imagePublicId').where('p.id=:id AND p.storeId=:storeId',{id,storeId:s.id}).setLock('pessimistic_write').getOne();if(!p)throw new NotFoundException();
      old=p.imagePublicId;const previousUrl=p.imageUrl;
      if(previousUrl)await m.getRepository(WishlistItem).update({productId:id,imagePublicId:IsNull(),imageUrl:previousUrl},{imageUrl:image.url});
      p.imageUrl=image.url;p.imagePublicId=image.publicId;await m.save(p);return m.findOneByOrFail(StoreProduct,{id});
    });await this.support.cleanup(old);return saved;}catch(e){await this.support.cleanup(image.publicId);throw e;}
  }
  @Post(['stores/me/logo','admin/stores/:storeId/logo']) @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file',imageUploadOptions))
  async logo(@Req() req:any,@UploadedFile() file?:Express.Multer.File){return this.storeImage(req,'logo',file);}
  @Post(['stores/me/qr','admin/stores/:storeId/qr']) @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file',imageUploadOptions))
  async qr(@Req() req:any,@UploadedFile() file?:Express.Multer.File){return this.storeImage(req,'qr',file);}
  private async storeImage(req:any,kind:'logo'|'qr',file?:Express.Multer.File){
    const s=await this.mine(req);const image=await this.cloud.uploadImage(file,IMAGE_FOLDERS.STORES);let old:string|null=null;
    const urlKey=kind==='logo'?'logoUrl':'qrImageUrl';const idKey=kind==='logo'?'logoPublicId':'qrPublicId';
    let result:Store;
    try{result=await this.db.transaction(async m=>{
      const row=await m.getRepository(Store).createQueryBuilder('s').addSelect(`s.${idKey}`).where('s.id=:id',{id:s.id}).setLock('pessimistic_write').getOneOrFail();
      old=row[idKey];row[urlKey]=image.url;row[idKey]=image.publicId;await m.save(row);return m.findOneByOrFail(Store,{id:s.id});
    });}catch(e){await this.support.cleanup(image.publicId);throw e;}
    await this.support.cleanup(old);return result;
  }
  @Get('stores/:id') async detail(@Param('id',ParseUUIDPipe) id:string){const s=await this.stores().andWhere('s.id=:id',{id}).getOne();if(!s)throw new NotFoundException('Tienda no disponible.');return s;}
  @Get('stores/:id/categories') async categories(@Param('id',ParseUUIDPipe) id:string){await this.detail(id);return this.db.getRepository(StoreCategory).find({where:{storeId:id,active:true},order:{name:'ASC'}});}
  @Get('products') async productsPublic(@Query() q:ProductQuery){
    const qb=this.products();if(q.q)qb.andWhere('(p.name ILIKE :q OR p.description ILIKE :q)',{q:`%${q.q}%`});if(q.storeId)qb.andWhere('p.storeId=:storeId',{storeId:q.storeId});if(q.categoryId)qb.andWhere('p.categoryId=:categoryId',{categoryId:q.categoryId});
    const [items,total]=await qb.orderBy('p.createdAt','DESC').addOrderBy('p.id','ASC').skip((q.page-1)*q.limit).take(q.limit).getManyAndCount();return {items:items.map(p=>({...p,currencyCode:'BOB',contactUrl:this.contactUrl(p)})),total,page:q.page,limit:q.limit};
  }
  private contactUrl(p:StoreProduct){return `https://wa.me/${p.store.whatsapp}?text=${encodeURIComponent(`Hola, me interesa ${p.name} (Bs ${p.price}). Código: ${p.id}. ¿Está disponible?`)}`;}
  @Get('products/:id') async product(@Param('id',ParseUUIDPipe) id:string){const p=await this.products().andWhere('p.id=:id',{id}).getOne();if(!p)throw new NotFoundException('Producto no disponible.');return {...p,currencyCode:'BOB',contactUrl:this.contactUrl(p)};}
  @Post('products/:id/wishlist') @UseGuards(JwtAuthGuard) async wish(@Req() req:any,@Param('id',ParseUUIDPipe) id:string,@Body() dto:WishProductDto){
    const p=await this.product(id);const list=await this.db.getRepository(Wishlist).findOneBy({id:dto.wishlistId,userId:req.user.sub,status:WishlistStatus.ACTIVE});if(!list)throw new NotFoundException('Lista de deseos no disponible.');
    const repo=this.db.getRepository(WishlistItem);const url=new URL(`/tiendas/productos/${id}`,this.config.get<string>('FRONTEND_URL')||'http://localhost:5173').href;
    await repo.createQueryBuilder().insert().values({wishlistId:list.id,productId:id,name:p.name,description:p.description.slice(0,700),imageUrl:p.imageUrl,imagePublicId:null,productUrl:url,estimatedPrice:p.price,currencyCode:'BOB',priority:WishlistItemPriority.MEDIUM,quantity:1,isReceived:false}).orIgnore().execute();
    return repo.findOneByOrFail({wishlistId:list.id,productId:id});
  }
}
