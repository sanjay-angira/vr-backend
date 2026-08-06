// cms-section.dto.ts

import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CmsSectionType } from '../entities/CMS/cmsSettings.entity';
import { Type } from 'class-transformer';

export class CreateCmsSectionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(CmsSectionType)
  type!: CmsSectionType;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsArray()
  productIds?: number[];

  @IsOptional()
  @IsArray()
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  blogIds?: number[];

  @IsOptional()
  @IsArray()
  offerIds?: number[];

  @IsOptional()
  @IsArray()
  faqIds?: number[];

  @IsOptional()
  @IsArray()
  bannerIds?: number[];

  @IsOptional()
  @IsArray()
  reviewIds?: number[];
}

export class UpdateCmsSectionDto extends PartialType(CreateCmsSectionDto) {}

export class ReorderSectionItemDto {
  @IsInt()
  id!: number;

  @IsInt()
  position!: number;
}

export class ReorderCmsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderSectionItemDto)
  sections!: ReorderSectionItemDto[];
}
