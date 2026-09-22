import type { Provider } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { v2 as cloudinary } from 'cloudinary';

import { CLOUDINARY_CLIENT } from './cloudinary.constants';

export const cloudinaryProvider: Provider = {
  provide: CLOUDINARY_CLIENT,

  inject: [ConfigService],

  useFactory: (configService: ConfigService) => {
    const cloudName = configService
      .get<string>('CLOUDINARY_CLOUD_NAME')
      ?.trim();

    const apiKey = configService
      .get<string>('CLOUDINARY_API_KEY')
      ?.trim();

    const apiSecret = configService
      .get<string>('CLOUDINARY_API_SECRET')
      ?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Falta configurar CLOUDINARY_CLOUD_NAME, ' +
          'CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return cloudinary;
  },
};