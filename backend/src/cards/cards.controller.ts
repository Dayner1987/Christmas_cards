import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { CardsService } from './cards.service';

import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    username: string;
  };
}

@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
  ) {}

  // =====================================================
  // CREAR TARJETA
  // POST /cards
  // =====================================================

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardsService.create(
      request.user.sub,
      createCardDto,
    );
  }

  // =====================================================
  // LISTAR TARJETAS PÚBLICAS
  // GET /cards/public
  // =====================================================

  @Get('public')
  findPublic() {
    return this.cardsService.findPublic();
  }

  // =====================================================
  // VER TARJETA PÚBLICA
  // GET /cards/public/:id
  // =====================================================

  @Get('public/:id')
  findPublicOne(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.cardsService.findPublicOne(
      id,
    );
  }

  // =====================================================
  // LISTAR MIS TARJETAS
  // GET /cards/my
  // =====================================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyCards(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cardsService.findMyCards(
      request.user.sub,
    );
  }

  // =====================================================
  // VER UNA TARJETA PROPIA
  // GET /cards/my/:id
  // =====================================================

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  findMyCard(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.cardsService.findMyCard(
      id,
      request.user.sub,
    );
  }

  // =====================================================
  // ACTUALIZAR TARJETA
  // PATCH /cards/:id
  // =====================================================

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardsService.update(
      id,
      request.user.sub,
      updateCardDto,
    );
  }

  // =====================================================
  // DESACTIVAR TARJETA
  // DELETE /cards/:id
  // =====================================================

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.cardsService.remove(
      id,
      request.user.sub,
    );
  }
}