import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserAddressDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  userId!: number;

  @ApiPropertyOptional({ example: 'Relative' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'Krishna Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone!: string;

  @ApiPropertyOptional({ example: 'krishna@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '12 Temple Road' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Near Market' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ example: 'Vrindavan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Uttar Pradesh' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '281121' })
  @IsString()
  @MinLength(6)
  @MaxLength(12)
  pincode!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateUserAddressDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  userId!: number;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ example: 'Krishna Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({ example: 'krishna@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12 Temple Road' })
  @IsOptional()
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
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '281121' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(12)
  pincode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}
