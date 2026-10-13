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