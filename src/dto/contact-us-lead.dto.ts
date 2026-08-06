import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContactLeadStatus } from 'src/entities/contact/contact-us-lead.entity';

export class SendContactLeadOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message: string;
}

export class VerifyContactLeadOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class UpdateContactLeadStatusDto {
  @ApiProperty({ enum: ContactLeadStatus })
  @IsEnum(ContactLeadStatus)
  status: ContactLeadStatus;
}

export class ContactLeadResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiPropertyOptional()
  verifiedAt?: Date | null;

  @ApiProperty({ enum: ContactLeadStatus })
  status: ContactLeadStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
