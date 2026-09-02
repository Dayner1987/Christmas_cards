import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  DeliveryChannel,
} from '../entities/user_card.entity';

export class CreateUserCardDto {
  @IsUUID('4', {
    message: 'El ID de la tarjeta no es válido',
  })
  cardId: string;

  @IsUUID('4', {
    message: 'El ID del destinatario no es válido',
  })
  recipientId: string;

  @IsOptional()
  @IsUUID('4', {
    message: 'El ID del grupo no es válido',
  })
  groupId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsNotEmpty({
    message: 'El mensaje es obligatorio',
  })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @IsOptional()
  @IsEnum(DeliveryChannel, {
    message:
      'El canal debe ser application, whatsapp, email o link',
  })
  deliveryChannel?: DeliveryChannel;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de programación no es válida',
    },
  )
  scheduledAt?: string;
}