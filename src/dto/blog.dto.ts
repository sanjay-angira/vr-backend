import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlogFaqDto {
  @ApiProperty({ example: 'What is this spice?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ example: 'This is a premium spice from India.' })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class BlogSeoDto {
  @ApiPropertyOptional({ example: 'Meta Title' })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Meta Description' })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/blog' })
  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @ApiPropertyOptional({ example: 'keyword' })
  @IsString()
  @IsOptional()
  focusKeyword?: string;

  @ApiPropertyOptional({ example: 'index, follow' })
  @IsString()
  @IsOptional()
  metaRobots?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ogTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ogDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ogImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitterCard?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitterTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitterDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitterImage?: string;

  @ApiPropertyOptional({ example: 'Article' })
  @IsString()
  @IsOptional()
  schemaType?: string;
}

export class CreateBlogDto {
  @ApiProperty({ example: 'My First Blog Post' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'my-first-blog-post' })
  @IsString()
  @IsOptional()
  slug!: string;

  @ApiProperty({ example: '<p>Content here...</p>' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'Short summary' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Stored on blog_images.originalUrl' })
  @IsString()
  @IsOptional()
  blogImage?: string;

  @ApiPropertyOptional({ description: 'Stored on blog_images.altText' })
  @IsString()
  @IsOptional()
  blogImageAlt?: string;

  @ApiPropertyOptional({ type: [BlogFaqDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BlogFaqDto)
  faqs?: BlogFaqDto[];

  @ApiPropertyOptional({
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  readingTime?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsOptional()
  tagIds?: number[];

  @ApiPropertyOptional({ type: BlogSeoDto })
  @IsOptional()
  seo?: BlogSeoDto;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateBlogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Stored on blog_images.originalUrl' })
  @IsString()
  @IsOptional()
  blogImage?: string;

  @ApiPropertyOptional({ description: 'Stored on blog_images.altText' })
  @IsString()
  @IsOptional()
  blogImageAlt?: string;

  @ApiPropertyOptional({ type: [BlogFaqDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BlogFaqDto)
  faqs?: BlogFaqDto[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'scheduled'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  readingTime?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsOptional()
  tagIds?: number[];

  @ApiPropertyOptional({ type: BlogSeoDto })
  @IsOptional()
  seo?: BlogSeoDto;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class BlogResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  excerpt!: string;

  @ApiPropertyOptional()
  blogImage!: string;

  @ApiPropertyOptional()
  blogImageAlt!: string;

  @ApiPropertyOptional({ type: [BlogFaqDto] })
  faqs!: BlogFaqDto[];

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  publishedAt!: Date;

  @ApiPropertyOptional()
  scheduledAt!: Date;

  @ApiProperty()
  views!: number;

  @ApiProperty()
  readingTime!: number;

  @ApiPropertyOptional({ type: BlogSeoDto })
  seo!: BlogSeoDto;

  @ApiPropertyOptional()
  tags!: any[];

  @ApiPropertyOptional()
  category!: any;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
