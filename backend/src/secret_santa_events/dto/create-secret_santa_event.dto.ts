import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

export class CreateSecretSantaEventDto {
  @IsUUID('4', {
    message: 'El ID del grupo no es válido',
  })
  groupId: string;

  @IsString()
  @IsNotEmpty({
    message: 'El nombre del evento es obligatorio',
  })
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'El presupuesto debe ser un número válido',
    },
  )
  @Min(0, {
    message: 'El presupuesto no puede ser negativo',
  })
  budget?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message:
      'La moneda debe tener tres letras mayúsculas, por ejemplo BOB',
  })
  currencyCode?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha del sorteo no es válida',
    },
  )
  drawDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de entrega no es válida',
    },
  )
  giftDeliveryDate?: string;
}