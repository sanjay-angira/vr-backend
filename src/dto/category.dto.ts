import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategorySeoDto {
  @ApiPropertyOptional({ example: 'Best Organic Spices | Spiritual Store' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    example: 'Discover the finest organic spices handpicked from across India.',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    example: 'organic spices, indian spices, turmeric, cumin',
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiPropertyOptional({ example: 'https://yoursite.com/categories/spices' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional({ example: 'organic spices' })
  @IsOptional()
  @IsString()
  focusKeyword?: string;

  @ApiPropertyOptional({ example: 'index, follow' })
  @IsOptional()
  @IsString()
  metaRobots?: string;

  @ApiPropertyOptional({ example: 'Best Organic Spices' })
  @IsOptional()
  @IsString()
  ogTitle?: string;

  @ApiPropertyOptional({ example: 'Shop premium organic spices.' })
  @IsOptional()
  @IsString()
  ogDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/spices-og.jpg' })
  @IsOptional()
  @IsString()
  ogImage?: string;

  @ApiPropertyOptional({ example: 'summary_large_image' })
  @IsOptional()
  @IsString()
  twitterCard?: string;

  @ApiPropertyOptional({ example: 'Best Organic Spices' })
  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @ApiPropertyOptional({ example: 'Shop premium organic spices.' })
  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/spices-twitter.jpg',
  })
  @IsOptional()
  @IsString()
  twitterImage?: string;

  @ApiPropertyOptional({ example: 'CollectionPage' })
  @IsOptional()
  @IsString()
  schemaType?: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Spices' })
  @IsNotEmpty()
  @IsString()
  categoryName!: string;

  @ApiProperty({ example: 'spices' })
  @IsNotEmpty()
  @IsString()
  categorySlug!: string;

  @ApiPropertyOptional({ example: 'A short summary of this category.' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Full description of this category.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  offer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/images/spices.jpg',
    description: 'Original image URL → category_images.originalUrl (+ derived sizes)',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  })
  @IsOptional()
  @IsString()
  publishStatus?: string;

  @ApiPropertyOptional({ description: 'Stored on category_images.image3d' })
  @IsOptional()
  @IsString()
  image3d?: string;

  @ApiPropertyOptional({ description: 'Stored on category_images.video' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Stored on category_images.altText' })
  @IsOptional()
  @IsString()
  imageAltText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnHomePage?: boolean;

  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  offerIds?: number[];

  @ApiPropertyOptional({ type: CategorySeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategorySeoDto)
  seo?: CategorySeoDto;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Spices' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ example: 'spices' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  parentId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Original image URL → category_images.originalUrl (+ derived sizes)',
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  offerIds?: number[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'scheduled'] })
  @IsOptional()
  @IsString()
  publishStatus?: string;

  @ApiPropertyOptional({ description: 'Stored on category_images.image3d' })
  @IsOptional()
  @IsString()
  image3d?: string | null;

  @ApiPropertyOptional({ description: 'Stored on category_images.video' })
  @IsOptional()
  @IsString()
  video?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Stored on category_images.altText' })
  @IsOptional()
  @IsString()
  imageAltText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnHomePage?: boolean;

  @ApiPropertyOptional({ type: CategorySeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategorySeoDto)
  seo?: CategorySeoDto;
}
