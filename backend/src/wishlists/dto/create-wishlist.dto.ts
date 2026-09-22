import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  WishlistVisibility,
} from '../entities/wishlist.entity';

export class CreateWishlistDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(WishlistVisibility)
  visibility?: WishlistVisibility;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}