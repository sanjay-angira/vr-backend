import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    description: 'The question text',
    example: 'How do I use this product?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'The answer to the question',
    example:
      'You can use this product by following the instructions in the manual.',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying FAQs',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the FAQ is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'ID of the product this FAQ belongs to',
    example: 1,
  })
  @IsNumber()
  productId: number;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({
    description: 'The question text',
    example: 'How do I properly use this product?',
  })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({
    description: 'The answer to the question',
    example:
      'You can use this product by following the instructions in the manual and watching our tutorial videos.',
  })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying FAQs',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the FAQ is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'ID of the product this FAQ belongs to',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  productId?: number;
}
