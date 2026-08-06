import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendWhatsAppOtpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber?: string;
}

export class VerifyWhatsAppOtpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp?: string;
}

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email!: string;
}

export class VerifyEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp!: string;
}

export class ResendEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber!: string;
}
