import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Card } from './entities/card.entity';

import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Card,
    ]),

    AuthModule,
    UsersModule,
  ],

  controllers: [
    CardsController,
  ],

  providers: [
    CardsService,
    JwtAuthGuard,
  ],

  exports: [
    CardsService,
    TypeOrmModule,
  ],
})
export class CardsModule {}