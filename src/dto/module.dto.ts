import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateModuleDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  router_link?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  categories?: string;

  @IsNumber()
  @IsOptional()
  categoryOrderNo?: number;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateModuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  router_link?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  categoryOrderNo?: number;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  categories?: string;
}

export class BulkCreateModulesDto {
  @IsNotEmpty()
  modules: CreateModuleDto[];
}

export class UpdateModulesOrderDto {
  @IsNotEmpty()
  modules: { id: number; order: number; category: string }[];
}

export class UpdateModulesCategoryOrderDto {
  @IsNotEmpty()
  categories: { category: string; order: number }[];
}

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  category: string;
}

export class UpdateModuleCategoryNameDto {
  @IsNotEmpty()
  @IsString()
  oldCategory: string;

  @IsNotEmpty()
  @IsString()
  newCategory: string;

  @IsNotEmpty()
  @IsString()
  category_icon: string;
}

export class DeleteCategoryDto {
  @IsNotEmpty()
  @IsString()
  category: string;
}
