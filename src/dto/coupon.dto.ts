import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { DiscountType } from '../entities/user/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Unique coupon code',
    example: 'HIRENRIDE50',
  })
  @IsString()
  @IsNotEmpty()
  couponCode!: string;

  @ApiPropertyOptional({
    description: 'Coupon image URL',
    example: 'https://cdn.example.com/coupons/hirenride-50.jpg',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Type of discount (percentage or fixed)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @ApiProperty({
    description: 'Discount value (percentage or fixed amount)',
    example: 50,
  })
  @IsNumber()
  discountValue!: number;

  @ApiProperty({
    description: 'Start date of coupon validity',
    example: '2025-12-05',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of coupon validity',
    example: '2025-12-30',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Whether the coupon is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the coupon is user specific',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isUserSpecific?: boolean;

  @ApiPropertyOptional({
    description: 'List of user IDs for user specific coupons',
    example: [108, 29],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  userIds?: number[];
}

export class UpdateCouponDto {
  @ApiPropertyOptional({
    description: 'Unique coupon code',
    example: 'HIRENRIDE50',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Coupon image URL',
    example: 'https://cdn.example.com/coupons/hirenride-50.jpg',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'Type of discount (percentage or fixed)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({
    description: 'Discount value (percentage or fixed amount)',
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Start date of coupon validity',
    example: '2025-12-05',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of coupon validity',
    example: '2025-12-30',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether the coupon is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the coupon is user specific',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isUserSpecific?: boolean;

  @ApiPropertyOptional({
    description: 'List of user IDs for user specific coupons',
    example: [108, 29],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  userIds?: number[];
}

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Coupon code to apply',
    example: 'WELCOME5',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({
    description: 'Logged-in user id (required for user-specific coupons)',
    example: 108,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;
}
