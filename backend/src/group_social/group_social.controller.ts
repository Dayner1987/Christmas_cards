
 // backend/src/group_social/group_social.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupSocialService } from './group_social.service';

@Controller('groups/:groupId/social')
@UseGuards(JwtAuthGuard)
export class GroupSocialController {
  constructor(
    private readonly socialService: GroupSocialService,
  ) {}

  @Get('members/:memberId')
  getMemberProfile(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Req() request: { user: { sub: string } },
  ) {
    return this.socialService.getMemberProfile(
      groupId,
      memberId,
      request.user.sub,
    );
  }
}
