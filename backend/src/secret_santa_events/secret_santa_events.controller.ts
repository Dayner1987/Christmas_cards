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
  SecretSantaEventsService,
} from './secret_santa_events.service';

import {
  CreateSecretSantaEventDto,
} from './dto/create-secret_santa_event.dto';

import {
  UpdateSecretSantaEventDto,
} from './dto/update-secret_santa_event.dto';

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

@Controller('secret-santa-events')
@UseGuards(JwtAuthGuard)
export class SecretSantaEventsController {
  constructor(
    private readonly eventsService:
      SecretSantaEventsService,
  ) {}

  // POST /secret-santa-events

  @Post()
  create(
    @Req()
    request: AuthenticatedRequest,

    @Body()
    createDto:
      CreateSecretSantaEventDto,
  ) {
    return this.eventsService.create(
      request.user.sub,
      createDto,
    );
  }

  // GET /secret-santa-events/my

  @Get('my')
  findMyEvents(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.eventsService.findMyEvents(
      request.user.sub,
    );
  }

  // GET /secret-santa-events/group/:groupId

  @Get('group/:groupId')
  findByGroup(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'groupId',
      new ParseUUIDPipe(),
    )
    groupId: string,
  ) {
    return this.eventsService.findByGroup(
      groupId,
      request.user.sub,
    );
  }

  // PATCH /secret-santa-events/:id/cancel

  @Patch(':id/cancel')
  cancel(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.eventsService.cancel(
      id,
      request.user.sub,
    );
  }

  // PATCH /secret-santa-events/:id/complete

  @Patch(':id/complete')
  complete(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.eventsService.complete(
      id,
      request.user.sub,
    );
  }

  // GET /secret-santa-events/:id

  @Get(':id')
  findOne(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.eventsService.findOne(
      id,
      request.user.sub,
    );
  }

  // PATCH /secret-santa-events/:id

  @Patch(':id')
  update(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    updateDto:
      UpdateSecretSantaEventDto,
  ) {
    return this.eventsService.update(
      id,
      request.user.sub,
      updateDto,
    );
  }
}