import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(1, 150)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 255)
  password: string;

  @IsString()
  @IsOptional()
  @Length(1, 80)
  first_name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 80)
  last_name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 30)
  phone?: string;

  @IsUrl()
  @IsOptional()
  @Length(1, 500)
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @Length(1, 500)
  biography?: string;

  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  timezone?: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  language_code?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended', 'deleted'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'CLIENT'])
  role?: string;
}