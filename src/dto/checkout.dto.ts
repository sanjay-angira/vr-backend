import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ example: 'guest_123_abc' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  /** Use a saved user address. Requires userId. */
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  addressId?: number;

  @ApiPropertyOptional({ example: 'Radha Sharma' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({ example: 'radha@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12 Temple Road' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Near Market' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Vrindavan' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '281121' })
  @ValidateIf((o: CheckoutDto) => !o.addressId)
  @IsString()
  @MinLength(6)
  @MaxLength(12)
  pincode?: string;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  addressLabel?: string;

  @ApiPropertyOptional({ example: 'Please call before delivery' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ example: 'cod', enum: ['cod', 'online'] })
  @IsIn(['cod', 'online'])
  paymentMethod!: 'cod' | 'online';

  @ApiPropertyOptional({
    description: 'Applied coupon id from POST /customer/apply-coupon',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  couponId?: number;
}
