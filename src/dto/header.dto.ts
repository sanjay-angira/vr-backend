import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHeaderSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  mobileLogoUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  stickyHeader?: boolean;

  @IsOptional()
  @IsBoolean()
  showSearch?: boolean;

  @IsOptional()
  @IsBoolean()
  showCart?: boolean;

  @IsOptional()
  @IsBoolean()
  showWishlist?: boolean;

  @IsOptional()
  @IsBoolean()
  showAccount?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, {
    message: 'backgroundColor must be a valid hex color',
  })
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, {
    message: 'textColor must be a valid hex color',
  })
  textColor?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  activeMenuId?: number | null;
}

export class CreateAnnouncementBarDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  linkText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  linkUrl?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/)
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/)
  textColor?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date | null;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;
}

export class UpdateAnnouncementBarDto extends PartialType(
  CreateAnnouncementBarDto,
) {}

export class CreateMenuDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens',
  })
  slug!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}

export class CreateMenuItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  menuId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
