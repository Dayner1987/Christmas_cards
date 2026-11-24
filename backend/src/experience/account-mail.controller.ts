import { Body, Controller, HttpException, Post, Req, UseGuards, Param, ParseUUIDPipe, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CardsService } from '../cards/cards.service';
import { User } from '../users/entities/user.entity';
import { PasswordReset } from './experience.entity';
import { EmailDto, ResetDto } from './experience.dto';
import { MailService } from './mail.service';

@Controller()
export class AccountMailController {
  private readonly logger = new Logger(AccountMailController.name);
  constructor(private readonly db: DataSource, private readonly users: UsersService,
    private readonly cards: CardsService, private readonly mail: MailService) {}
  private async limit(key: string, max: number, seconds: number) {
    // Shared by all server instances; no email addresses are retained here.
    const digest = createHash('sha256').update(key).digest('hex');
    const rows = await this.db.query(`INSERT INTO request_limits (key, expires, count)
      VALUES ($1, NOW() + $2 * INTERVAL '1 second', 1)
      ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN request_limits.expires < NOW() THEN 1 ELSE request_limits.count + 1 END,
      expires = CASE WHEN request_limits.expires < NOW() THEN NOW() + $2 * INTERVAL '1 second' ELSE request_limits.expires END
      RETURNING count`, [digest, seconds]);
    if (rows[0].count > max) throw new HttpException('Demasiados intentos. Espera antes de volver a intentar.', 429);
  }
  @Post('cards/:id/email') @UseGuards(JwtAuthGuard)
  async sendCard(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EmailDto, @Req() req: any) {
    await this.users.assertAccess(req.user.sub);
    const card = await this.cards.findPublicOne(id);
    await this.limit(`card:${req.user.sub}`, 10, 3600);
    const url = this.mail.frontend(`/tarjetas/${card.id}`);
    await this.mail.send(dto.email, `Te compartieron una tarjeta: ${card.name.replace(/[\r\n]/g, ' ')}`,
      `¡Hola!\n\nTe compartieron esta tarjeta: ${card.name}\n${card.description || ''}\n\nÁbrela aquí:\n${url}\n\nNo necesitas una cuenta para verla.`);
    return { message: 'Tarjeta aceptada por el servidor de correo para su envío.' };
  }
  @Post('auth/forgot-password')
  async forgot(@Body() dto: EmailDto, @Req() req: any) {
    await this.limit(`forgot-ip:${req.ip}`, 10, 3600);
    const email = dto.email.trim().toLowerCase();
    await this.limit(`forgot-email:${email}`, 3, 900);
    const user = await this.db.getRepository(User).createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email }).getOne();
    if (user?.status === 'active') {
      const token = randomBytes(32).toString('hex');
      const hash = createHash('sha256').update(token).digest('hex');
      const repo = this.db.getRepository(PasswordReset);
      await repo.save({ hash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60000) });
      try {
        await this.mail.send(user.email, 'Recupera tu contraseña',
          `Abre este enlace para establecer una nueva contraseña:\n${this.mail.frontend(`/reset-password?token=${token}`)}\n\nCaduca en 30 minutos y solo puede utilizarse una vez. Si no lo solicitaste, ignora este mensaje.`);
      } catch {
        await repo.delete({ hash });
        this.logger.warn('No se pudo enviar un correo de recuperación. Revisar SMTP.');
      }
    }
    return { message: 'Si existe una cuenta activa con ese correo, recibirás un enlace para recuperar tu contraseña.' };
  }
  @Post('auth/reset-password')
  async reset(@Body() dto: ResetDto, @Req() req: any) {
    await this.limit(`reset:${req.ip}`, 20, 900);
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('La contraseña supera 72 bytes.');
    const hash = createHash('sha256').update(dto.token).digest('hex');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.db.transaction(async manager => {
      const token = await manager.findOneBy(PasswordReset, { hash });
      if (!token) throw new BadRequestException('Enlace inválido o vencido.');
      // Lock the user first: concurrent tokens for one user cannot both succeed.
      const user = await manager.findOne(User, { where: { id: token.userId }, lock: { mode: 'pessimistic_write' } });
      const current = await manager.findOneBy(PasswordReset, { hash });
      if (!user || user.status !== 'active' || !current || current.expiresAt <= new Date())
        throw new BadRequestException('Enlace inválido o vencido.');
      await manager.update(User, user.id, { passwordHash, passwordChangedAt: new Date() });
      await manager.delete(PasswordReset, { userId: user.id });
    });
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
