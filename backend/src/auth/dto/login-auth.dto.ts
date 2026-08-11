import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // Puede ser email o username

  @IsString()
  @MinLength(6)
  password: string;
}