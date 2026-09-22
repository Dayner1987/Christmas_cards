import { BadRequestException } from '@nestjs/common';

import type {
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import { memoryStorage } from 'multer';

import {
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_SIZE,
} from './cloudinary.constants';

export const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),

  limits: {
    fileSize: IMAGE_MAX_SIZE,
    files: 1,
  },

  fileFilter: (_request, file, callback) => {
    if (
      !IMAGE_ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
      callback(
        new BadRequestException(
          'Solo se permiten imágenes JPG, PNG o WEBP.',
        ),
        false,
      );

      return;
    }

    callback(null, true);
  },
};