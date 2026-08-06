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
import { DeleteUploadDto } from '../dto/upload.dto';
import { successResponse } from 'src/commonServices/response.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        path: { type: 'string', example: 'products/images' },
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
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
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
    return successResponse(true, 'File deleted successfully');
  }

  @Delete('video')
  @ApiOperation({ summary: 'Delete a video from S3' })
  async deleteVideo(@Body() dto: DeleteUploadDto) {
    await this.s3Service.deleteObject(dto.url, dto.path, dto.key);
    return successResponse(true, 'Video deleted successfully');
  }
}
