import { PartialType } from '@nestjs/mapped-types';
import { CreateSecretSantaAssignmentDto } from './create-secret_santa_assignment.dto';

export class UpdateSecretSantaAssignmentDto extends PartialType(CreateSecretSantaAssignmentDto) {}
