import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

import {
  WishlistItemPriority,
} from '../entities/wishlist_item.entity';

export class CreateWishlistItemDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  productUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  imageUrl?: string;

  @IsOptional()
  @IsNumberString()
  estimatedPrice?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @IsEnum(WishlistItemPriority)
  priority?: WishlistItemPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}