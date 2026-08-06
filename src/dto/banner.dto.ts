import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  image!: string;

  @IsOptional()
  @IsString()
  mobileImage?: string;

  @IsOptional()
  @IsString()
  bannerLink?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsNumber()
  sectionId!: number;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
