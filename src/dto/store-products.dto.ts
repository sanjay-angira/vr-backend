import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './common.dto';

export class StoreProductsQueryDto extends PaginationDto {
  /** Comma-separated category ids */
  @IsString()
  @IsOptional()
  categoryIds?: string;

  @IsString()
  @IsOptional()
  minPrice?: string;

  @IsString()
  @IsOptional()
  maxPrice?: string;

  /** Minimum average approved rating (1–5). Products at or above this value. */
  @IsString()
  @IsOptional()
  minRating?: string;

  /** Minimum applied offer discount percentage (e.g. 20 = 20% or more). */
  @IsString()
  @IsOptional()
  minDiscount?: string;

  /** Comma-separated offer ids */
  @IsString()
  @IsOptional()
  offerIds?: string;

  /** newest | price_asc | price_desc | name_asc | discount_desc */
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  newArrivals?: string;

  @IsString()
  @IsOptional()
  featured?: string;

  @IsString()
  @IsOptional()
  bestDeals?: string;

  /** Comma-separated CMS product layout section slugs */
  @IsString()
  @IsOptional()
  sectionSlugs?: string;
}
