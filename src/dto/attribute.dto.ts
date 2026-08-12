import { IsString, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationDto } from './common.dto';

export class CreateAttributeDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isFilterable!: boolean;

  @IsBoolean()
  isRequired!: boolean;

  @IsBoolean()
  supportsImage!: boolean;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}
export class AttributeQueryDto extends PaginationDto {}
