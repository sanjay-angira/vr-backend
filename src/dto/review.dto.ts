import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsOptional()
  userId: number;

  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isManual: boolean;

  @IsString()
  @IsOptional()
  userName: string;
}

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isManual: boolean;

  @IsString()
  @IsOptional()
  userName: string;

  @IsInt()
  @IsOptional()
  userId: number;

  @IsInt()
  @IsOptional()
  productId: number;
}


























export class BulkReviewItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export class ProductReviewsDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkReviewItemDto)
  reviews!: BulkReviewItemDto[];
}

export class BulkImportReviewsDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsBoolean()
  fictional!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductReviewsDto)
  products!: ProductReviewsDto[];
}
