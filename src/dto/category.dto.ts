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

  @ApiPropertyOptional({ example: ['organic spices', 'Indian spices'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryKeywords?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  robotsIndex?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  robotsFollow?: boolean;

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

  @ApiPropertyOptional({ description: 'SEO content for the category page' })
  @IsOptional()
  @IsString()
  seoContent?: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Spices' })
  @IsNotEmpty()
  @IsString()
  categoryName!: string;

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
    description: 'Category image URL (uploaded as WebP)',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: '3:2 featured category image URL' })
  @IsOptional()
  @IsString()
  image3x2?: string;

  @ApiPropertyOptional({ description: 'Desktop category image uploaded as WebP' })
  @IsOptional()
  @IsString()
  desktopImage?: string;

  @ApiPropertyOptional({ description: 'Tablet category image uploaded as WebP' })
  @IsOptional()
  @IsString()
  tabletImage?: string;

  @ApiPropertyOptional({ description: 'Category video URL' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/spices-mobile.jpg',
    description: 'Mobile category image (uploaded as WebP)',
  })
  @IsOptional()
  @IsString()
  mobileImage?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/spices-banner.webp',
    description: 'Wide banner image displayed on the category shop page',
  })
  @IsOptional()
  @IsString()
  bannerImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnHomePage?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  useAsHeroBanner?: boolean;

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
  @Type(() => Number)
  @IsNumber()
  parentId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Category image URL (uploaded as WebP)',
  })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ description: '3:2 featured category image URL' })
  @IsOptional()
  @IsString()
  image3x2?: string | null;

  @ApiPropertyOptional({ description: 'Desktop category image uploaded as WebP' })
  @IsOptional()
  @IsString()
  desktopImage?: string | null;

  @ApiPropertyOptional({ description: 'Tablet category image uploaded as WebP' })
  @IsOptional()
  @IsString()
  tabletImage?: string | null;

  @ApiPropertyOptional({ description: 'Category video URL' })
  @IsOptional()
  @IsString()
  video?: string | null;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  offerIds?: number[];

  @ApiPropertyOptional({
    description: 'Mobile category image (uploaded as WebP)',
  })
  @IsOptional()
  @IsString()
  mobileImage?: string | null;

  @ApiPropertyOptional({
    description: 'Wide banner image displayed on the category shop page',
  })
  @IsOptional()
  @IsString()
  bannerImage?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnHomePage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useAsHeroBanner?: boolean;

  @ApiPropertyOptional({ type: CategorySeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategorySeoDto)
  seo?: CategorySeoDto;
}
