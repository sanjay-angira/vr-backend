import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  desktopImage!: string;

  @IsOptional()
  @IsString()
  tabletImage?: string;

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
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
