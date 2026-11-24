import { Type, Transform } from 'class-transformer';
import { ValidateIf, IsString, IsOptional, IsUUID, IsBoolean, MaxLength, MinLength, Matches, IsInt, Min, Max, IsIn, IsNumber, IsArray, ArrayMaxSize, ValidateNested, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
const trim = ({value}: {value:unknown}) => typeof value === 'string' ? value.trim() : value;
export class PageQuery {
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(100) q?: string;
  @ValidateIf((_o, v) => v !== undefined) @Type(()=>Number) @IsInt() @Min(1) page: number = 1;
  @ValidateIf((_o, v) => v !== undefined) @Type(()=>Number) @IsInt() @Min(1) @Max(50) limit: number = 24;
}
export class ProductQuery extends PageQuery {
  @ValidateIf((_o, v) => v !== undefined) @IsUUID() storeId?: string;
  @ValidateIf((_o, v) => v !== undefined) @IsUUID() categoryId?: string;
}
export class RegisterStoreDto {
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(50) username: string;
  @Transform(trim) @IsEmail() @MaxLength(150) email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsString() @Matches(/^[1-9]\d{7,14}$/) whatsapp: string;
}
export class StoreUpdateDto {
  @ValidateIf((_o, v) => v !== undefined) @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) name?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @Matches(/^\d{0,30}$/) nit?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(1000) description?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(500) address?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(500) facebookUrl?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(500) tiktokUrl?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @Matches(/^[1-9]\d{7,14}$/) whatsapp?:string;
}
export class CategoryDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) name:string;
  @ValidateIf((_o, v) => v !== undefined) @IsBoolean() active?:boolean;
}
export class CategoryUpdateDto extends PartialType(CategoryDto, { skipNullProperties: false }) {}
export class ProductDto {
  @IsUUID() categoryId:string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(150) name:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(2000) description?:string;
  @IsString() @Matches(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/) price:string;
  @ValidateIf((_o, v) => v !== undefined) @IsBoolean() active?:boolean;
}
export class ProductUpdateDto extends PartialType(ProductDto, { skipNullProperties: false }) {}
export class WishProductDto { @IsUUID() wishlistId:string; }
export class MessageDto {
  @IsUUID() clientMessageId:string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(2000) text:string;
}
export class ChatQuery {
  @ValidateIf((_o, v) => v !== undefined) @IsString() @Matches(/^\d{1,18}$/) before?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsString() @Matches(/^\d{1,18}$/) after?:string;
}
export class TreeElementDto {
  @IsUUID() id:string;
  @IsIn(['emoji','text','image']) kind:'emoji'|'text'|'image';
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(80) value?:string;
  @ValidateIf((_o, v) => v !== undefined) @IsUUID() assetId?:string;
  @IsNumber() @Min(0) @Max(1) x:number;
  @IsNumber() @Min(0) @Max(1) y:number;
  @IsNumber() @Min(.025) @Max(.5) size:number;
  @IsNumber() @Min(-180) @Max(180) rotation:number;
}
export class TreeDto {
  @IsInt() @Min(0) revision:number;
  @IsArray() @ArrayMaxSize(150) @ValidateNested({each:true}) @Type(()=>TreeElementDto) elements:TreeElementDto[];
}
