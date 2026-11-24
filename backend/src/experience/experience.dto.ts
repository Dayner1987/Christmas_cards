import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class EmailDto {
  @IsEmail() @MaxLength(150) email: string;
}
export class ResetDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
}
export class TrackDto {
  @IsString() @MinLength(1) @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(500) youtubeUrl?: string;
}
export class TrackUpdateDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) title?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
