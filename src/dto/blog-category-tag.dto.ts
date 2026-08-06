import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateBlogCategoryDto {
  @ApiProperty({ example: 'Technology', description: 'Name of the category' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'technology',
    description: 'Slug of the category (optional, auto-generated if empty)',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({
    example: true,
    description: 'Is the category active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBlogCategoryDto {
  @ApiProperty({
    example: 'Technology',
    description: 'Name of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'technology',
    description: 'Slug of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({ example: true, description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBlogTagDto {
  @ApiProperty({ example: 'NestJS', description: 'Name of the tag' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'nestjs',
    description: 'Slug of the tag',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({ example: true, description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBlogTagDto {
  @ApiProperty({
    example: 'NestJS',
    description: 'Name of the tag',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'nestjs',
    description: 'Slug of the tag',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({
    example: 'All regarding technology',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({ example: true, description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
