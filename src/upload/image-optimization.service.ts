import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import sharp, { type Metadata as SharpMetadata } from 'sharp';
import { S3Service } from './s3.service';
import {
  IMAGE_OPTIMIZATION_PRESETS,
  ImageOptimizationType,
  MAX_OPTIMIZED_IMAGE_BYTES,
  OptimizedImageAsset,
  SUPPORTED_IMAGE_MIME_TYPES,
  buildFlatAssetBase,
  setColumnForWidth,
} from './image-optimization.types';

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private readonly webpQualityOverride: number | null;

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.webpQualityOverride = this.readQualityEnv('IMAGE_WEBP_QUALITY');
  }

  isSupportedImageMime(mimeType?: string): boolean {
    if (!mimeType) return false;
    return (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(
      mimeType.toLowerCase(),
    );
  }

  resolveImageType(raw?: string | null): ImageOptimizationType | null {
    if (!raw?.trim()) return null;
    const normalized = raw.trim().toLowerCase().replace(/-/g, '_');
    if (normalized in IMAGE_OPTIMIZATION_PRESETS) {
      return normalized as ImageOptimizationType;
    }
    return null;
  }

  async processAndUpload(
    file: Express.Multer.File,
    imageType: ImageOptimizationType,
    entityId?: string | null,
  ): Promise<OptimizedImageAsset> {
    this.validateUpload(file);

    let metadata: SharpMetadata;
    try {
      const input = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer);
      metadata = await sharp(input).metadata();
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown sharp error';
      this.logger.error(`Sharp metadata failed: ${detail}`);
      throw new BadRequestException(
        'Invalid or corrupted image. Please upload a valid image file.',
      );
    }

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    if (!width || !height) {
      throw new BadRequestException(
        'Could not read image dimensions. Please upload a valid image.',
      );
    }

    const preset = IMAGE_OPTIMIZATION_PRESETS[imageType];
    const assetId = (entityId?.trim() || randomUUID()).replace(
      /[^a-zA-Z0-9_-]/g,
      '',
    );
    const baseFolder = `${preset.folder}/${assetId}`;
    const webpQuality = this.webpQualityOverride ?? preset.webpQuality;

    // Banner / blog / category: store a single WebP file only.
    if (preset.webpOnly) {
      return this.processWebpOnlyUpload(
        file,
        baseFolder,
        assetId,
        width,
        height,
        preset.widths,
        webpQuality,
      );
    }

    const originalExt = this.resolveOriginalExtension(
      file.originalname,
      file.mimetype,
      metadata.format,
    );
    const originalFileName = `${Date.now()}${this.sanitizeFileName(file.originalname, originalExt)}`;
    const originalKey = `${baseFolder}/original/${originalFileName}`;

    const originalUpload = await this.s3Service.uploadBuffer(
      file.buffer,
      originalKey,
      file.mimetype || `image/${originalExt === 'jpg' ? 'jpeg' : originalExt}`,
    );

    const columns = buildFlatAssetBase(originalUpload.Location);
    const uniqueWidths = this.resolveTargetWidths(preset.widths, width);

    // Product: keep original + resized WebP variants.
    try {
      for (const targetWidth of uniqueWidths) {
        const webpBuffer = await sharp(file.buffer)
          .resize({
            width: targetWidth,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: webpQuality, effort: 4 })
          .toBuffer();

        const webpUpload = await this.s3Service.uploadBuffer(
          webpBuffer,
          `${baseFolder}/${targetWidth}/image.webp`,
          'image/webp',
        );

        setColumnForWidth(columns, targetWidth, 'webp', webpUpload.Location);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(
        `Image optimization failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      try {
        await this.s3Service.deleteObject(
          originalUpload.Location,
          null,
          originalKey,
        );
      } catch {
        // ignore cleanup errors
      }
      throw new InternalServerErrorException(
        `Failed to process image: ${message}`,
      );
    }

    return {
      ...columns,
      original: originalUpload.Location,
      Location: originalUpload.Location,
      Key: originalUpload.Key,
      Bucket: originalUpload.Bucket,
      ETag: originalUpload.ETag,
      assetId,
      width,
      height,
    };
  }

  /** Convert upload to a single .webp and return that as Location. */
  private async processWebpOnlyUpload(
    file: Express.Multer.File,
    baseFolder: string,
    assetId: string,
    width: number,
    height: number,
    widths: number[],
    webpQuality: number,
  ): Promise<OptimizedImageAsset> {
    const maxWidth = Math.max(...widths);
    const targetWidth = Math.min(maxWidth, width);
    const fileName = `${Date.now()}-${this.sanitizeFileName(file.originalname, 'webp').replace(/\.[^.]+$/, '')}.webp`;
    const objectKey = `${baseFolder}/${fileName}`;

    try {
      const webpBuffer = await sharp(file.buffer)
        .resize({
          width: targetWidth,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: webpQuality, effort: 4 })
        .toBuffer();

      const upload = await this.s3Service.uploadBuffer(
        webpBuffer,
        objectKey,
        'image/webp',
      );

      const columns = buildFlatAssetBase(upload.Location);
      return {
        ...columns,
        original: upload.Location,
        Location: upload.Location,
        Key: upload.Key,
        Bucket: upload.Bucket,
        ETag: upload.ETag,
        assetId,
        width,
        height,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(
        `WebP-only upload failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Failed to process image: ${message}`,
      );
    }
  }

  async processBufferAndUpload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    imageType: ImageOptimizationType,
    entityId?: string | null,
  ): Promise<OptimizedImageAsset> {
    const fakeFile = {
      buffer,
      originalname: originalFileName,
      mimetype: mimeType,
      size: buffer.length,
    } as Express.Multer.File;

    return this.processAndUpload(fakeFile, imageType, entityId);
  }

  private resolveTargetWidths(
    presetWidths: number[],
    sourceWidth: number,
  ): number[] {
    const smaller = presetWidths.filter((w) => w < sourceWidth);
    const nativeKey = presetWidths.find((w) => w >= sourceWidth);
    const targets = [...smaller];
    if (nativeKey) {
      targets.push(nativeKey);
    }
    if (targets.length === 0) {
      targets.push(presetWidths[0]);
    }
    return [...new Set(targets)].sort((a, b) => a - b);
  }

  private validateUpload(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (!this.isSupportedImageMime(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type "${file.mimetype}". Allowed: JPEG, PNG, WebP, GIF, TIFF, AVIF.`,
      );
    }
    if (file.size > MAX_OPTIMIZED_IMAGE_BYTES) {
      throw new BadRequestException(
        `Image exceeds maximum size of ${Math.round(MAX_OPTIMIZED_IMAGE_BYTES / (1024 * 1024))}MB`,
      );
    }
  }

  private readQualityEnv(key: string): number | null {
    const raw = this.configService.get<string>(key);
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 1 || value > 100) return null;
    return Math.round(value);
  }

  private sanitizeFileName(originalName: string, fallbackExt: string): string {
    const base = originalName.replace(/\s+/g, '').replace(/[^\w.-]/g, '');
    if (!base) {
      return `image.${fallbackExt}`;
    }
    const ext = extname(base).toLowerCase();
    if (!ext) {
      return `${base}.${fallbackExt}`;
    }
    return base;
  }

  private resolveOriginalExtension(
    originalName: string,
    mimeType: string,
    sharpFormat?: string,
  ): string {
    const fromName = extname(originalName).replace('.', '').toLowerCase();
    if (fromName === 'jpeg') return 'jpg';
    if (fromName) return fromName;

    if (sharpFormat === 'jpeg') return 'jpg';
    if (sharpFormat) return sharpFormat;

    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    return 'jpg';
  }
}
