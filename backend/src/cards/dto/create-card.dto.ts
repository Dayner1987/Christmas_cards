import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { CardCategory } from '../entities/card.entity';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(1000)
  frontImageUrl: string;

  @IsOptional()
  @IsString()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(1000)
  backgroundImageUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(1000)
  previewImageUrl?: string;

  @IsOptional()
  @IsEnum(CardCategory, {
    message:
      'La categoría debe ser christmas, new_year, secret_santa o custom',
  })
  category?: CardCategory;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}