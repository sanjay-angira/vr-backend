import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { DiscountType } from '../entities/product/offer.entity';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerSlug: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  discountValue: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  timeBased: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

export class UpdateOfferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerSlug: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  discountValue: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  timeBased: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

export class OfferResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  offerName: string;

  @ApiProperty()
  offerSlug: string;

  @ApiPropertyOptional()
  image?: string | null;

  @ApiProperty({ enum: DiscountType })
  discountType: DiscountType;

  @ApiProperty()
  discountValue: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
