import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { S3Service } from './s3.service';
import { ImageOptimizationService } from './image-optimization.service';

@Module({
  controllers: [UploadController],
  providers: [S3Service, ImageOptimizationService],
  exports: [S3Service, ImageOptimizationService],
})
export class UploadModule {}
