import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  GroupJoinMode,
  GroupVisibility,
} from '../entities/group.entity';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility;

  @IsOptional()
  @IsEnum(GroupJoinMode)
  joinMode?: GroupJoinMode;

  @IsOptional()
  @IsInt()
  @Min(2)
  maximumMembers?: number;

  @IsOptional()
  @IsDateString()
  invitationExpiresAt?: string;

  @IsOptional()
  @IsBoolean()
  invitationEnabled?: boolean;
}