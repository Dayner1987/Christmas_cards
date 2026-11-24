import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors, NotFoundException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MusicTrack } from './experience.entity';
import { TrackDto, TrackUpdateDto } from './experience.dto';
import { youtubeId, mediaKind } from './music.validation';
@Controller('music')
export class MusicController {
  private readonly logger = new Logger(MusicController.name);
  constructor(private readonly db: DataSource, private readonly users: UsersService, private readonly cloud: CloudinaryService) {}
  @Get() list() { return this.db.getRepository(MusicTrack).find({ where: { active: true }, order: { createdAt: 'DESC' } }); }
  @Get('admin') @UseGuards(JwtAuthGuard)
  async all(@Req() req: any) {
    await this.users.assertAccess(req.user.sub, undefined, true);
    return this.db.getRepository(MusicTrack).find({ order: { createdAt: 'DESC' } });
  }
  @Post() @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  async create(@Req() req: any, @Body() dto: TrackDto, @UploadedFile() file?: Express.Multer.File) {
    await this.users.assertAccess(req.user.sub, undefined, true);
    const data = await this.prepare(dto, file);
    try { return await this.db.getRepository(MusicTrack).save({ ...data, active: true }); }
    catch (error) { if (data.publicId) await this.cleanup(data.publicId); throw error; }
  }
  private async prepare(dto: TrackDto, file?: Express.Multer.File) {
    if (!dto.title.trim()) throw new BadRequestException('Escribe un título.');
    if (Boolean(file) === Boolean(dto.youtubeUrl)) throw new BadRequestException('Selecciona un archivo o un enlace de YouTube.');
    let kind: 'mp3' | 'mp4' | 'youtube' = 'youtube';
    let url: string;
    let publicId: string | null = null;
    if (file) {
      try { kind = mediaKind(file.buffer, file.originalname); }
      catch { throw new BadRequestException('Solo se permiten archivos MP3 o MP4 válidos, de hasta 25 MB.'); }
      const upload = await this.cloud.uploadMusic(file);
      url = upload.url; publicId = upload.publicId;
    } else {
      try { url = `https://www.youtube.com/watch?v=${youtubeId(dto.youtubeUrl!)}`; }
      catch { throw new BadRequestException('Introduce un enlace válido de YouTube.'); }
    }
    return { title: dto.title.trim(), kind, url, publicId };
  }
  @Patch(':id') @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TrackUpdateDto) {
    await this.users.assertAccess(req.user.sub, undefined, true);
    if (dto.title !== undefined && !dto.title.trim()) throw new BadRequestException('Escribe un título.');
    const repo = this.db.getRepository(MusicTrack);
    const track = await repo.findOneBy({ id });
    if (!track) throw new NotFoundException('Canción no encontrada.');
    return repo.save(Object.assign(track, dto, dto.title === undefined ? {} : { title: dto.title.trim() }));
  }
  @Post(':id/source') @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  async replaceSource(@Req() req: any, @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TrackDto, @UploadedFile() file?: Express.Multer.File) {
    await this.users.assertAccess(req.user.sub, undefined, true);
    const repo = this.db.getRepository(MusicTrack);
    if (!await repo.existsBy({ id })) throw new NotFoundException('Canción no encontrada.');
    // Upload before replacing, so a failed upload preserves the existing song.
    const replacement = await this.prepare(dto, file);
    let previous: string | null = null;
    try {
      const updated = await this.db.transaction(async manager => {
        const current = await manager.findOne(MusicTrack, { where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!current) throw new NotFoundException('Canción no encontrada.');
        previous = current.publicId;
        Object.assign(current, { title: replacement.title, kind: replacement.kind, url: replacement.url, publicId: replacement.publicId });
        const saved = await manager.save(current);
        return saved;
      });
      if (previous) await this.cleanup(previous);
      return updated;
    } catch (error) {
      if (replacement.publicId) await this.cleanup(replacement.publicId);
      throw error;
    }
  }
  @Delete(':id') @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.users.assertAccess(req.user.sub, undefined, true);
    const track = await this.db.transaction(async manager => {
      const found = await manager.findOne(MusicTrack, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!found) throw new NotFoundException('Canción no encontrada.');
      await manager.delete(MusicTrack, id);
      return found;
    });
    if (track.publicId) await this.cleanup(track.publicId);
    return { message: 'Canción eliminada.' };
  }
  private async cleanup(id: string) {
    try { await this.cloud.deleteMusic(id); }
    catch { this.logger.warn(`Limpieza pendiente de música: ${id}`); }
  }
}
