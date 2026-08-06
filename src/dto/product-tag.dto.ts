import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductTagDto {
  @ApiProperty({ example: 'Spices', description: 'Name of the tag' })
  @IsNotEmpty()
  @IsString()
  tagName: string;

  @ApiProperty({ example: 'spices', description: 'Slug of the tag' })
  @IsNotEmpty()
  @IsString()
  tagSlug: string;

  @ApiProperty({ example: true, description: 'Is active' })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}

export class UpdateProductTagDto {
  @ApiPropertyOptional({ example: 'Spices' })
  @IsOptional()
  @IsString()
  tagName?: string;

  @ApiPropertyOptional({ example: 'spices' })
  @IsOptional()
  @IsString()
  tagSlug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
