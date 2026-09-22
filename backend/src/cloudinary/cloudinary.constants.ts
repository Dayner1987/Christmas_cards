export const CLOUDINARY_CLIENT = Symbol('CLOUDINARY_CLIENT');

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

export const IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const IMAGE_ALLOWED_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];

export const IMAGE_FOLDERS = {
  USERS: 'christmas_cards/users',
  CARDS: 'christmas_cards/cards',
} as const;

export type ImageFolder =
  (typeof IMAGE_FOLDERS)[keyof typeof IMAGE_FOLDERS];