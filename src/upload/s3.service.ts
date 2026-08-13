import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'node:https';
import * as tls from 'node:tls';
import { Readable } from 'node:stream';

export interface S3UploadResult {
  Location: string;
  Key: string;
  Bucket: string;
  ETag?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region =
      this.configService.get<string>('AWS_REGION')?.trim() || 'ap-south-1';
    this.bucket =
      this.configService.get<string>('AWS_S3_BUCKET')?.trim() ||
      'vrindavan-rasa';

    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID')?.trim() || '';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY')?.trim() || '';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error(
        'AWS credentials are missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY on the live host (Render/env), then redeploy/restart.',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      // Only pass explicit keys when both exist — empty strings cause
      // "authorization header is malformed; non-empty Access Key (AKID)".
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
      requestHandler: new NodeHttpHandler({
        httpsAgent: S3Service.createHttpsAgent(),
      }),
    });
  }

  private assertCredentialsConfigured() {
    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID')?.trim() || '';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY')?.trim() || '';

    if (!accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'S3 is not configured on this server. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, then restart the backend.',
      );
    }
  }

  private static createHttpsAgent(): https.Agent {
    const getCACertificates = (
      tls as typeof tls & {
        getCACertificates?: (type: 'bundled' | 'system') => string[];
      }
    ).getCACertificates;

    if (typeof getCACertificates === 'function') {
      return new https.Agent({
        ca: [...getCACertificates('bundled'), ...getCACertificates('system')],
        keepAlive: true,
      });
    }

    return new https.Agent({ keepAlive: true });
  }

  private normalizeFolderPath(path?: string | null): string {
    return (path || '').replace(/^\/+|\/+$/g, '');
  }

  private buildObjectUrl(objectKey: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${objectKey}`;
  }

  private getObjectKeyFromUrl(
    fileUrl: string,
    fallbackPath?: string | null,
  ): string | null {
    if (!fileUrl) {
      return null;
    }

    const trimmedUrl = fileUrl.trim();

    try {
      const parsedUrl = new URL(trimmedUrl);
      const pathname = decodeURIComponent(parsedUrl.pathname).replace(
        /^\/+/,
        '',
      );

      if (!pathname) {
        return null;
      }

      const virtualHostedPrefix = `${this.bucket}.s3.`;
      if (
        parsedUrl.hostname.startsWith(virtualHostedPrefix) ||
        parsedUrl.hostname === `${this.bucket}.s3.amazonaws.com`
      ) {
        return pathname;
      }

      const bucketPrefix = `${this.bucket}/`;
      if (pathname.startsWith(bucketPrefix)) {
        return pathname.slice(bucketPrefix.length);
      }

      if (
        parsedUrl.hostname.startsWith('s3.') ||
        parsedUrl.hostname === 's3.amazonaws.com'
      ) {
        const segments = pathname.split('/').filter(Boolean);
        if (segments[0] === this.bucket && segments.length > 1) {
          return segments.slice(1).join('/');
        }
      }

      return pathname;
    } catch {
      if (trimmedUrl.includes('/')) {
        return trimmedUrl.replace(/^\/+/, '');
      }
    }

    const fileName = trimmedUrl.split('/').pop();
    const folder = this.normalizeFolderPath(fallbackPath);

    if (fileName && folder) {
      return `${folder}/${decodeURIComponent(fileName)}`;
    }

    return fileName ? decodeURIComponent(fileName) : null;
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    path?: string | null,
  ): Promise<S3UploadResult> {
    if (!fileBuffer?.length) {
      throw new InternalServerErrorException(
        'Upload failed: empty file buffer',
      );
    }

    const sanitizedFileName = fileName.replace(/\s+/g, '');
    const cleanPath = this.normalizeFolderPath(path);
    const timestamp = Date.now();
    const nameKey = `${timestamp}${sanitizedFileName}`;
    const objectKey = cleanPath ? `${cleanPath}/${nameKey}` : nameKey;

    return this.uploadBuffer(fileBuffer, objectKey, contentType);
  }

  /** Upload a buffer to an exact S3 object key. */
  async uploadBuffer(
    fileBuffer: Buffer,
    objectKey: string,
    contentType: string,
  ): Promise<S3UploadResult> {
    this.assertCredentialsConfigured();

    if (!fileBuffer?.length) {
      throw new InternalServerErrorException(
        'Upload failed: empty file buffer',
      );
    }

    const key = objectKey.replace(/^\/+/, '');

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        },
      });

      const result = await upload.done();

      return {
        Location: this.buildObjectUrl(key),
        Key: key,
        Bucket: this.bucket,
        ETag: result.ETag,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 error';
      this.logger.error(
        `S3 upload failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${message}`,
      );
    }
  }

  async getObjectBuffer(
    fileUrlOrKey: string,
  ): Promise<{ buffer: Buffer; contentType?: string; key: string }> {
    this.assertCredentialsConfigured();

    const objectKey =
      this.getObjectKeyFromUrl(fileUrlOrKey, null) ||
      fileUrlOrKey.replace(/^\/+/, '');

    if (!objectKey) {
      throw new InternalServerErrorException(
        'Could not resolve S3 object key for download',
      );
    }

    try {
      const result = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      const body = result.Body;
      if (!body) {
        throw new InternalServerErrorException('Empty S3 object body');
      }

      const buffer = await this.streamToBuffer(body as Readable);

      return {
        buffer,
        contentType: result.ContentType,
        key: objectKey,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 error';
      this.logger.error(
        `S3 getObject failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Failed to download file from S3: ${message}`,
      );
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(
    fileUrl: string,
    fallbackPath?: string | null,
    explicitKey?: string | null,
  ): Promise<boolean> {
    this.assertCredentialsConfigured();

    const objectKey =
      explicitKey?.trim() || this.getObjectKeyFromUrl(fileUrl, fallbackPath);
    if (!objectKey) {
      throw new InternalServerErrorException(
        'Could not resolve S3 object key from URL',
      );
    }

    this.logger.log(`Deleting S3 object: ${objectKey}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 error';
      const errorName =
        error && typeof error === 'object' && 'name' in error
          ? String((error as { name?: string }).name)
          : '';

      if (errorName === 'NoSuchKey' || errorName === 'NotFound') {
        this.logger.warn(`S3 object already deleted or missing: ${objectKey}`);
        return true;
      }

      this.logger.error(
        `S3 delete failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }
}
