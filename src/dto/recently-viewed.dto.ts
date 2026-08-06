import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddRecentlyViewedDto {
  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number | null;

  @ApiPropertyOptional({
    example: 'guest_1710000000_abc123',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string | null;

  @ApiProperty({
    example: [12],
    description: 'One or more product ids that were viewed',
    type: [Number],
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  productIds!: number[];
}
