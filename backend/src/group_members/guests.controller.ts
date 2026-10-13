import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../cloudinary/image-upload.options';
import { GroupMembersService } from './group_members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGuestDto, UpdateGuestWishlistDto } from './dto/create-guest.dto';

import { RegisterDto } from '../auth/dto/register.dto';

@Controller('groups')
export class GuestsController {
  constructor(private readonly members: GroupMembersService) {}

@Post('me/register')
registerGuest(
  @Headers('x-guest-token') token: string,
  @Body() dto: RegisterDto,
) {
  return this.members.registerGuest(token, dto);
}

  // Invitación en modo LINK: no hace falta registrarse.
  @Post('invitation/:code/guests')
  joinGuest(@Param('code') code: string, @Body() dto: CreateGuestDto) {
    return this.members.joinGuest(code, dto.name);
  }

  @Post('invitation/:code/join')
  @UseGuards(JwtAuthGuard)
  joinRegistered(@Param('code') code: string, @Req() req: any) {
    return this.members.joinRegistered(code, req.user.sub);
  }

  @Post(':groupId/guests')
  @UseGuards(JwtAuthGuard)
  addGuest(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: any, @Body() dto: CreateGuestDto) {
    return this.members.addGuestByModerator(groupId, req.user.sub, dto.name);
  }

  @Delete(':groupId/guests/:guestMemberId')
  @UseGuards(JwtAuthGuard)
  removeGuest(@Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('guestMemberId', ParseUUIDPipe) guestMemberId: string, @Req() req: any) {
    return this.members.removeGuest(groupId, guestMemberId, req.user.sub);
  }

  @Patch(':groupId/guests/:guestMemberId/approve')
  @UseGuards(JwtAuthGuard)
  approveGuest(@Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('guestMemberId', ParseUUIDPipe) guestMemberId: string, @Req() req: any) {
    return this.members.approveGuest(groupId, guestMemberId, req.user.sub);
  }
}

@Controller('guests')
export class GuestSelfController {
  constructor(private readonly members: GroupMembersService) {}

  @Get('me')
  me(@Headers('x-guest-token') token: string) { return this.members.getGuestByToken(token); }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  avatar(@Headers('x-guest-token') token: string, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.members.updateGuestAvatar(token, file);
  }

  @Put('me/wishlist')
  wishlist(@Headers('x-guest-token') token: string, @Body() dto: UpdateGuestWishlistDto) {
    return this.members.updateGuestWishlist(token, dto.items);
  }
}
