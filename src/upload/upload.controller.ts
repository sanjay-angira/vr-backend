import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { ImageOptimizationService } from './image-optimization.service';
import { DeleteUploadDto } from '../dto/upload.dto';
import { successResponse } from 'src/commonServices/response.service';
import { MAX_OPTIMIZED_IMAGE_BYTES } from './image-optimization.types';
import { collectOptimizedImageUrls } from 'src/commonServices/optimized-image-columns';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly imageOptimizationService: ImageOptimizationService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Upload a file to S3. Pass imageType to generate optimized WebP/JPG variants as flat columns.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        path: { type: 'string', example: 'products/images' },
        imageType: {
          type: 'string',
          enum: ['product', 'category', 'blog', 'banner', 'banner_mobile'],
        },
        entityId: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('path') path?: string,
    @Body('imageType') imageTypeRaw?: string,
    @Body('entityId') entityId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const imageType =
      this.imageOptimizationService.resolveImageType(imageTypeRaw);

    if (imageType) {
      if (file.size > MAX_OPTIMIZED_IMAGE_BYTES) {
        throw new BadRequestException(
          `Image exceeds maximum size of ${Math.round(MAX_OPTIMIZED_IMAGE_BYTES / (1024 * 1024))}MB`,
        );
      }

      const result = await this.imageOptimizationService.processAndUpload(
        file,
        imageType,
        entityId,
      );

      return successResponse(result, 'Image uploaded and optimized successfully');
    }

    const result = await this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );

    return successResponse(result, 'File uploaded successfully');
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an image from S3' })
  async deleteImage(@Body() dto: DeleteUploadDto) {
    await this.s3Service.deleteObject(dto.url, dto.path, dto.key);

    if (dto.variants) {
      const urls = collectOptimizedImageUrls(dto.variants).filter(
        (url) => url !== dto.url.trim(),
      );
      await Promise.allSettled(
        urls.map((url) => this.s3Service.deleteObject(url)),
      );
    }

    return successResponse(true, 'File deleted successfully');
  }

  @Delete('video')
  @ApiOperation({ summary: 'Delete a video from S3' })
  async deleteVideo(@Body() dto: DeleteUploadDto) {
    await this.s3Service.deleteObject(dto.url, dto.path, dto.key);
    return successResponse(true, 'Video deleted successfully');
  }
}
