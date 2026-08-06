import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFooterSectionDto {
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateFooterSectionDto extends PartialType(
  CreateFooterSectionDto,
) {}

export class CreateFooterItemDto {
  @IsNumber()
  sectionId?: number;

  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateFooterItemDto extends PartialType(CreateFooterItemDto) {}

export class CreateFooterSocialLinkDto {
  @IsNumber()
  sectionId?: number;

  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateFooterSocialLinkDto extends PartialType(
  CreateFooterSocialLinkDto,
) {}

export class CreateFooterPaymentMethodDto {
  @IsNumber()
  sectionId?: number;

  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateFooterPaymentMethodDto extends PartialType(
  CreateFooterPaymentMethodDto,
) {}

export class UpdateFooterSettingsDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  copyrightText?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

class SectionOrderDto {
  @IsNumber()
  id?: number;

  @IsNumber()
  position?: number;
}

export class ReorderFooterSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderDto)
  sections?: SectionOrderDto[];
}

class ItemOrderDto {
  @IsNumber()
  id?: number;

  @IsNumber()
  position?: number;
}

export class ReorderFooterItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrderDto)
  items?: ItemOrderDto[];
}

export class UpdateStatusDto {
  @IsBoolean()
  status?: boolean;
}
