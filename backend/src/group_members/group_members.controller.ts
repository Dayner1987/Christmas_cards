import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { GroupMembersService } from './group_members.service';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { GroupMemberRole } from './entities/group_member.entity';

@Controller('groups/:groupId/members')
@UseGuards(JwtAuthGuard)
export class GroupMembersController {
  constructor(
    private readonly groupMembersService: GroupMembersService,
  ) {}

  @Get()
  findAll(
    @Param('groupId') groupId: string,
  ) {
    return this.groupMembersService.findMembersByGroup(
      groupId,
    );
  }

  @Post()
  addMember(
    @Param('groupId') groupId: string,
    @Req() request: any,
    @Body() dto: AddGroupMemberDto,
  ) {
    return this.groupMembersService.addMember(
      groupId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':userId/role')
  updateRole(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Req() request: any,
    @Body('role') role: GroupMemberRole,
  ) {
    return this.groupMembersService.updateMemberRole(
      groupId,
      userId,
      request.user.sub,
      role,
    );
  }

  @Delete(':userId')
  removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Req() request: any,
  ) {
    return this.groupMembersService.removeMember(
      groupId,
      userId,
      request.user.sub,
    );
  }

  @Post('leave')
  leaveGroup(
    @Param('groupId') groupId: string,
    @Req() request: any,
  ) {
    return this.groupMembersService.leaveGroup(
      groupId,
      request.user.sub,
    );
  }
}