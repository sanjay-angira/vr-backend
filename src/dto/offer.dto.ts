import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { DiscountType } from '../entities/product/offer.entity';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  desktopImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tabletImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobileImage?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  useAsHeroBanner?: boolean;
}

export class UpdateOfferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offerName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  desktopImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tabletImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobileImage?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  useAsHeroBanner?: boolean;
}

export class OfferResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  offerName: string;

  @ApiProperty()
  offerSlug: string;

  @ApiPropertyOptional()
  desktopImage?: string | null;

  @ApiPropertyOptional()
  tabletImage?: string | null;

  @ApiPropertyOptional()
  mobileImage?: string | null;

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
  useAsHeroBanner: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
