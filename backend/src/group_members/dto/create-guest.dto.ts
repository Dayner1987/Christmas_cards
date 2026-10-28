import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGuestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}

export class GuestWishDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  productUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateGuestWishlistDto {
  @IsArray()
  @ArrayMaxSize(5, { message: 'Se permiten como máximo cinco deseos.' })
  @ValidateNested({ each: true })
  @Type(() => GuestWishDto)
  items: GuestWishDto[];
}
