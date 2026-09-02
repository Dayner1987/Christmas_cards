import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  Request,
} from 'express';

import {
  UserCardsService,
} from './user_cards.service';

import {
  CreateUserCardDto,
} from './dto/create-user_card.dto';

import {
  UpdateUserCardDto,
} from './dto/update-user_card.dto';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
    username: string;
  };
}

@Controller('user-cards')
@UseGuards(JwtAuthGuard)
export class UserCardsController {
  constructor(
    private readonly userCardsService:
      UserCardsService,
  ) {}

  // POST /user-cards

  @Post()
  create(
    @Req() request: AuthenticatedRequest,

    @Body()
    createDto: CreateUserCardDto,
  ) {
    return this.userCardsService.create(
      request.user.sub,
      createDto,
    );
  }

  // GET /user-cards/sent

  @Get('sent')
  findSent(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userCardsService.findSent(
      request.user.sub,
    );
  }

  // GET /user-cards/received

  @Get('received')
  findReceived(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userCardsService.findReceived(
      request.user.sub,
    );
  }

  // PATCH /user-cards/:id/send

  @Patch(':id/send')
  send(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.userCardsService.send(
      id,
      request.user.sub,
    );
  }

  // PATCH /user-cards/:id/read

  @Patch(':id/read')
  markAsRead(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.userCardsService.markAsRead(
      id,
      request.user.sub,
    );
  }

  // PATCH /user-cards/:id/cancel

  @Patch(':id/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.userCardsService.cancel(
      id,
      request.user.sub,
    );
  }

  // GET /user-cards/:id

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.userCardsService.findOne(
      id,
      request.user.sub,
    );
  }

  // PATCH /user-cards/:id

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    updateDto: UpdateUserCardDto,
  ) {
    return this.userCardsService.update(
      id,
      request.user.sub,
      updateDto,
    );
  }
}