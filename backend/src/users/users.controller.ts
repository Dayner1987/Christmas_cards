import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { isUUID } from 'class-validator';

import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserRole } from './entities/user.entity';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import {
  imageUploadOptions,
} from '../cloudinary/image-upload.options';

interface AuthenticatedRequest {
  user?: {
    id?: string;
    sub?: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getMyProfile(
    @Req() request: AuthenticatedRequest,
  ) {
    const user = await this.getActor(request);

    return this.usersService.toPublicUser(user);
  }

  @Patch('me')
  async updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.getActor(request);

    return this.usersService.update(
      user.id,
      updateUserDto,
    );
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', imageUploadOptions),
  )
  async uploadMyAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile()
    file: Express.Multer.File | undefined,
  ) {
    const user = await this.getActor(request);

    return this.usersService.updateAvatar(
      user.id,
      file,
    );
  }

  @Delete('me/avatar')
  async removeMyAvatar(
    @Req() request: AuthenticatedRequest,
  ) {
    const user = await this.getActor(request);

    return this.usersService.removeAvatar(user.id);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    await this.requireAdmin(request);

    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    await this.requireAdmin(request);

    // El servicio ya aplica toPublicUser().
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.requireOwnerOrAdmin(request, id);

    const user = await this.usersService.findOne(id);

    return this.usersService.toPublicUser(user);
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.requireOwnerOrAdmin(request, id);

    return this.usersService.update(
      id,
      updateUserDto,
    );
  }

  @Delete(':id')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.requireAdmin(request);

    return this.usersService.remove(id);
  }

  private async getActor(
    request: AuthenticatedRequest,
  ) {
    const id =
      request.user?.id ?? request.user?.sub;

    if (typeof id !== 'string' || !isUUID(id)) {
      throw new UnauthorizedException(
        'La sesión no contiene un usuario válido.',
      );
    }

    const user = await this.usersService.findOne(id);

    if (user.status !== 'active') {
      throw new ForbiddenException(
        'La cuenta no está activa.',
      );
    }

    return user;
  }

  private async requireAdmin(
    request: AuthenticatedRequest,
  ) {
    const user = await this.getActor(request);

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Esta operación requiere permisos de administrador.',
      );
    }

    return user;
  }

  private async requireOwnerOrAdmin(
    request: AuthenticatedRequest,
    targetId: string,
  ) {
    const user = await this.getActor(request);

    if (
      user.id !== targetId &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'No puedes acceder al perfil de otro usuario.',
      );
    }

    return user;
  }
}