import {
  Body,
  Controller,
  Delete,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSecretSantaTemplateDto, UpdateSecretSantaTemplateDto } from './dto/create-secret_santa_template.dto';
import { imageUploadOptions } from '../cloudinary/image-upload.options';

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

  // EVENTOS GLOBALES: no requieren grupo y solo los administra ADMIN.
  @Get('templates')
  findTemplates() {
    return this.eventsService.findTemplates();
  }

  @Post('templates')
  createTemplate(@Req() request: AuthenticatedRequest, @Body() dto: CreateSecretSantaTemplateDto) {
    return this.eventsService.createTemplate(request.user.sub, dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSecretSantaTemplateDto) {
    return this.eventsService.updateTemplate(id, request.user.sub, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.deactivateTemplate(id, request.user.sub);
  }

  @Post('templates/:id/image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadTemplateImage(@Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined) {
    return this.eventsService.uploadTemplateImage(id, request.user.sub, file);
  }

  @Post('group/:groupId/from-template/:templateId')
  applyTemplate(@Req() request: AuthenticatedRequest,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string) {
    return this.eventsService.applyTemplate(groupId, templateId, request.user.sub);
  }

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

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadImage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) { return this.eventsService.uploadImage(id, request.user.sub, file); }

  @Delete(':id/image')
  deleteImage(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.deleteImage(id, request.user.sub);
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