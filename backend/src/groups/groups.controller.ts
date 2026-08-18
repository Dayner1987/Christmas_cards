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

import { GroupsService } from './groups.service';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    username?: string;
    email?: string;
  };
}

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
  ) {}

  // =====================================================
  // CREAR GRUPO
  // POST /groups
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req()
    request: AuthenticatedRequest,

    @Body()
    createGroupDto: CreateGroupDto,
  ) {
    const ownerId = request.user.sub;

    return this.groupsService.create(
      ownerId,
      createGroupDto,
    );
  }

  // =====================================================
  // LISTAR GRUPOS
  // GET /groups
  // =====================================================

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  // =====================================================
  // LISTAR MIS GRUPOS
  // GET /groups/me
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyGroups(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.groupsService.findByOwner(
      request.user.sub,
    );
  }

  // =====================================================
  // BUSCAR POR CÓDIGO DE INVITACIÓN
  // GET /groups/invitation/:code
  // =====================================================

  @Get('invitation/:code')
  findByInvitationCode(
    @Param('code')
    code: string,
  ) {
    return this.groupsService
      .findByInvitationCode(code);
  }

  // =====================================================
  // BUSCAR GRUPO POR UUID
  // GET /groups/:id
  // =====================================================

  @Get(':id')
  findOne(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.groupsService.findOne(id);
  }

  // =====================================================
  // ACTUALIZAR GRUPO
  // PATCH /groups/:id
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,

    @Body()
    updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(
      id,
      request.user.sub,
      updateGroupDto,
    );
  }

  // =====================================================
  // ARCHIVAR GRUPO
  // PATCH /groups/:id/archive
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Patch(':id/archive')
  archive(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.groupsService.archive(
      id,
      request.user.sub,
    );
  }

  // =====================================================
  // REGENERAR INVITACIÓN
  // PATCH /groups/:id/invitation
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Patch(':id/invitation')
  regenerateInvitation(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.groupsService
      .regenerateInvitation(
        id,
        request.user.sub,
      );
  }

  // =====================================================
  // ELIMINAR
  // DELETE /groups/:id
  // =====================================================

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.groupsService.remove(
      id,
      request.user.sub,
    );
  }
}