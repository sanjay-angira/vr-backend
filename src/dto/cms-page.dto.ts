import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCmsPageDto {
  @ApiProperty({ example: 'Privacy Policy' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'privacy-policy' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  slug!: string;

  @ApiProperty({
    example: '<h1>Privacy Policy</h1><p>Your privacy matters...</p>',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCmsPageDto extends PartialType(CreateCmsPageDto) {}

export class CmsPageQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pageNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  column?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  order?: string;
}
