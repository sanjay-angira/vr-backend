import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a valid 10-digit Indian mobile number',
  })
  phone!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN code must be six digits' })
  pincode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  registeredName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  returnAddress!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Return PIN code must be six digits' })
  returnPin!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  returnCity!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  returnState!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  returnCountry!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: unknown;

  @IsOptional()
  @IsBoolean()
  isActive?: unknown;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
