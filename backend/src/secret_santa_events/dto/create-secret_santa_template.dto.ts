// src/secret_santa_events/dto/create-secret_santa_template.dto.ts
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSecretSantaEventDto } from './create-secret_santa_event.dto';

/** No solicita ID de grupo ni fechas: la elección se realiza por grupo. */
export class CreateSecretSantaTemplateDto extends OmitType(
  CreateSecretSantaEventDto,
  ['groupId', 'drawDate', 'giftDeliveryDate'] as const,
) {}

export class UpdateSecretSantaTemplateDto extends PartialType(
  CreateSecretSantaTemplateDto,
) {}
