import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { v2 as cloudinary } from 'cloudinary';

import {
  CLOUDINARY_CLIENT,
  IMAGE_ALLOWED_FORMATS,
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_FOLDERS,
  IMAGE_MAX_SIZE,
} from './cloudinary.constants';

import type {
  ImageFolder,
} from './cloudinary.constants';

import type {
  UploadedImage,
} from './interfaces/uploaded-image.interface';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(
    CloudinaryService.name,
  );

  constructor(
    @Inject(CLOUDINARY_CLIENT)
    private readonly client: typeof cloudinary,
  ) {}

  async uploadImage(
    file: Express.Multer.File | undefined,
    folder: ImageFolder,
  ): Promise<UploadedImage> {
    this.validateImage(file);

    if (!Object.values(IMAGE_FOLDERS).includes(folder)) {
      throw new BadRequestException(
        'La carpeta de imágenes no es válida.',
      );
    }

    const validFile = file!;

    return new Promise<UploadedImage>(
      (resolve, reject) => {
        const uploadStream =
          this.client.uploader.upload_stream(
            {
              resource_type: 'image',
              folder,
              public_id: randomUUID(),
              allowed_formats: IMAGE_ALLOWED_FORMATS,
              overwrite: false,
              timeout: 60000,
            },
            (error, result) => {
              if (error) {
                this.logger.error(
                  `Cloudinary rechazó la subida. Código: ${
                    error.http_code ?? 'desconocido'
                  }`,
                );

                if (error.http_code === 400) {
                  reject(
                    new BadRequestException(
                      'No se pudo procesar la imagen. ' +
                        'Utiliza un archivo JPG, PNG o WEBP válido.',
                    ),
                  );

                  return;
                }

                reject(
                  new BadGatewayException(
                    'No se pudo subir la imagen a Cloudinary.',
                  ),
                );

                return;
              }

              if (!result) {
                reject(
                  new BadGatewayException(
                    'Cloudinary no devolvió información de la imagen.',
                  ),
                );

                return;
              }

              resolve({
                publicId: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
              });
            },
          );

        uploadStream.once('error', () => {
          reject(
            new BadGatewayException(
              'Se interrumpió la subida de la imagen.',
            ),
          );
        });

        uploadStream.end(validFile.buffer);
      },
    );
  }

  async deleteImage(publicId: string): Promise<void> {
    const belongsToProject = Object.values(
      IMAGE_FOLDERS,
    ).some((folder) =>
      publicId.startsWith(`${folder}/`),
    );

    if (!belongsToProject) {
      throw new BadRequestException(
        'El identificador de la imagen no es válido.',
      );
    }

    try {
      const result = (await this.client.uploader.destroy(
        publicId,
        {
          resource_type: 'image',
          invalidate: true,
        },
      )) as { result: string };

      if (
        result.result !== 'ok' &&
        result.result !== 'not found'
      ) {
        throw new Error(
          'Cloudinary no confirmó la eliminación.',
        );
      }
    } catch {
      this.logger.error(
        'No se pudo eliminar una imagen de Cloudinary.',
      );

      throw new BadGatewayException(
        'No se pudo eliminar la imagen.',
      );
    }
  }

  private validateImage(
    file: Express.Multer.File | undefined,
  ): void {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException(
        'Debes seleccionar una imagen.',
      );
    }

    if (file.buffer.length > IMAGE_MAX_SIZE) {
      throw new PayloadTooLargeException(
        'La imagen no puede superar los 5 MB.',
      );
    }

    if (
      !IMAGE_ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'Solo se permiten imágenes JPG, PNG o WEBP.',
      );
    }
  }
}