import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateFooterSectionDto {
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
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
