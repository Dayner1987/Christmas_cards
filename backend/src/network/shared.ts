import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash } from 'node:crypto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '../users/entities/user.entity';
export function publicPerson(u:User) { return {id:u.id,username:u.username,firstName:u.firstName,lastName:u.lastName,avatarUrl:u.avatarUrl,biography:u.biography}; }
export function socialUrl(value:string|undefined, domain:string) {
  if (!value) return '';
  try { const u=new URL(value); if (u.protocol!=='https:' || u.username || u.password || (u.hostname!==domain && !u.hostname.endsWith('.'+domain))) throw Error(); return u.href; }
  catch { throw new BadRequestException(`Utiliza un enlace HTTPS de ${domain}.`); }
}
@Injectable()
export class NetworkSupport {
  private logger=new Logger(NetworkSupport.name);
  constructor(private db:DataSource,private cloud:CloudinaryService){}
  async limit(key:string,max:number,seconds:number) {
    const digest=createHash('sha256').update(key).digest('hex');
    const rows=await this.db.query(`INSERT INTO request_limits(key,expires,count) VALUES($1,NOW()+$2*INTERVAL '1 second',1)
      ON CONFLICT(key) DO UPDATE SET count=CASE WHEN request_limits.expires<NOW() THEN 1 ELSE request_limits.count+1 END,
      expires=CASE WHEN request_limits.expires<NOW() THEN NOW()+$2*INTERVAL '1 second' ELSE request_limits.expires END RETURNING count`,[digest,seconds]);
    if(rows[0].count>max) throw new HttpException('Demasiados intentos. Intenta de nuevo más tarde.',429);
  }
  async cleanup(id:string|null) { if(!id)return; try {await this.cloud.deleteImage(id);}catch{this.logger.warn(`Imagen pendiente de limpieza: ${id}`);} }
}
