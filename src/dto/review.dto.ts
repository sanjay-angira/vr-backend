import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Min,
  Max,
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
