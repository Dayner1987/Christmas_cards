import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

import {
  GroupJoinMode,
  GroupVisibility,
} from '../entities/group.entity';

export class UpdateGroupDto {
  @IsOptional()
  @IsUUID('4', { message: 'El evento seleccionado debe ser un UUID válido.' })
  selectedEventId?: string | null;
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'themeColor debe tener el formato #RRGGBB' })
  themeColor?: string;

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