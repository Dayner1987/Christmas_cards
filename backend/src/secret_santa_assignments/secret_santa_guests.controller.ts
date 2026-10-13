import { Controller, Get, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { SecretSantaAssignmentsService } from './secret_santa_assignments.service';

@Controller('secret-santa-guests')
export class SecretSantaGuestsController {
  constructor(private readonly service: SecretSantaAssignmentsService) {}

  @Get('event/:eventId/me')
  getAssigned(@Param('eventId', ParseUUIDPipe) eventId: string,
    @Headers('x-guest-token') token: string) {
    return this.service.findGuestAssignment(eventId, token);
  }

  @Patch('event/:eventId/delivered')
  delivered(@Param('eventId', ParseUUIDPipe) eventId: string,
    @Headers('x-guest-token') token: string) {
    return this.service.markGuestAsDelivered(eventId, token);
  }
  
@Get('events')
findMyEvents(
  @Headers('x-guest-token') token: string,
) {
  return this.service.findGuestEvents(token);
}

}
