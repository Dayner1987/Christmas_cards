import {
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
  SecretSantaAssignmentsService,
} from './secret_santa_assignments.service';

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

@Controller(
  'secret-santa-assignments',
)
@UseGuards(JwtAuthGuard)
export class SecretSantaAssignmentsController {
  constructor(
    private readonly assignmentsService:
      SecretSantaAssignmentsService,
  ) {}

  // POST /secret-santa-assignments/event/:eventId/draw

  @Post('event/:eventId/draw')
  draw(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'eventId',
      new ParseUUIDPipe(),
    )
    eventId: string,
  ) {
    return this.assignmentsService.draw(
      eventId,
      request.user.sub,
    );
  }

  // GET /secret-santa-assignments/event/:eventId/me

  @Get('event/:eventId/me')
  findMyAssignment(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'eventId',
      new ParseUUIDPipe(),
    )
    eventId: string,
  ) {
    return this.assignmentsService
      .findMyAssignment(
        eventId,
        request.user.sub,
      );
  }

  // PATCH /secret-santa-assignments/event/:eventId/delivered

  @Patch(
    'event/:eventId/delivered',
  )
  markAsDelivered(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'eventId',
      new ParseUUIDPipe(),
    )
    eventId: string,
  ) {
    return this.assignmentsService
      .markAsDelivered(
        eventId,
        request.user.sub,
      );
  }

  // GET /secret-santa-assignments/event/:eventId/summary

  @Get('event/:eventId/summary')
  getEventSummary(
    @Req()
    request: AuthenticatedRequest,

    @Param(
      'eventId',
      new ParseUUIDPipe(),
    )
    eventId: string,
  ) {
    return this.assignmentsService
      .getEventSummary(
        eventId,
        request.user.sub,
      );
  }
}