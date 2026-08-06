import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  ValidateNested,
} from 'class-validator';

export class UserPermissionDto {
  @IsInt()
  @Type(() => Number)
  moduleId: number;

  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @IsOptional()
  @IsBoolean()
  canAdd?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  profileImage: string | undefined;

  // ✅ FIXED HERE
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  roleIds: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionDto)
  permissions?: UserPermissionDto[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profileImage: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionDto)
  permissions?: UserPermissionDto[];
}
