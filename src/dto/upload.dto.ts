import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

/** Flat optimized URL columns — original + WebP sizes only. */
export class OptimizedImageColumnsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webp400?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webp800?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webp1200?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webp1440?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webp1920?: string | null;
}

export class DeleteUploadDto {
  @ApiProperty({
    description: 'Full S3 URL or object key of the file to delete',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

  /** Flat sibling URLs to delete alongside the primary file. */
  @ApiPropertyOptional({ type: OptimizedImageColumnsDto })
  @IsOptional()
  @IsObject()
  variants?: OptimizedImageColumnsDto;
}
