// src/types/secret_santa_templates.schema.ts
export interface SecretSantaTemplate {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  budget: number | string | null;
  currencyCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecretSantaTemplate {
  name: string;
  description?: string;
  budget?: number;
  currencyCode?: string;
}

export type UpdateSecretSantaTemplate = Partial<CreateSecretSantaTemplate>;

export interface ApplyTemplateResult {
  groupId: string;
  selectedEventId: string;
  event: import('./secret_santa_events.schema').SecretSantaEvent;
}
