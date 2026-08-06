import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteUploadDto {
  @ApiProperty({
    description: 'Full S3 URL or object key of the file to delete',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Exact S3 object key when available (preferred for delete)',
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({
    description: 'Fallback folder path used when url is not a full S3 URL',
  })
  @IsOptional()
  @IsString()
  path?: string;
}
