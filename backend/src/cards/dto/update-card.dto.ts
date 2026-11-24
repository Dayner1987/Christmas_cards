import { IsBoolean, IsOptional } from 'class-validator';

import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';

export class UpdateCardDto extends PartialType(
  CreateCardDto,
) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}