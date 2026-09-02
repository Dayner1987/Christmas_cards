import {
  OmitType,
  PartialType,
} from '@nestjs/mapped-types';


import {
  CreateSecretSantaEventDto,
} from './create-secret_santa_event.dto';


class EditableSecretSantaEventDto extends OmitType(
  CreateSecretSantaEventDto,
  ['groupId'] as const,
) {}


export class UpdateSecretSantaEventDto extends PartialType(
  EditableSecretSantaEventDto,
) {}