import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class VerifyRazorpayPaymentDto {
  @ApiProperty({ example: 'VR-ABC123' })
  @IsString()
  @MinLength(3)
  orderNumber!: string;

  @ApiProperty({ example: 'order_xxxxx' })
  @IsString()
  razorpay_order_id!: string;

  @ApiProperty({ example: 'pay_xxxxx' })
  @IsString()
  razorpay_payment_id!: string;

  @ApiProperty({ example: 'signature_hex' })
  @IsString()
  razorpay_signature!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ example: 'guest_123' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
