import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CardsModule } from '../cards/cards.module';
import { MusicTrack, PasswordReset, RequestLimit } from './experience.entity';
import { MusicController } from './music.controller';
import { AccountMailController } from './account-mail.controller';
import { MailService } from './mail.service';
@Module({ imports: [TypeOrmModule.forFeature([MusicTrack, PasswordReset, RequestLimit]), AuthModule, UsersModule, CardsModule],
  controllers: [MusicController, AccountMailController], providers: [MailService] })
export class ExperienceModule {}
