import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { PaginationDto } from './common.dto';

export class CreateBrandDto {
  @IsNotEmpty()
  @IsString()
  brandName: string;

  @IsNotEmpty()
  @IsString()
  brandSlug: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  offerIds?: number[];
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  offerIds?: number[];
}

export class BrandDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

// Combined query DTO for Brands list (pagination + filters)
export class BrandQueryDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
