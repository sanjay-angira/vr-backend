import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class WishlistMutationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  userId!: number;

  @ApiProperty({ example: 12, description: 'Product variant id' })
  @Type(() => Number)
  @IsNumber()
  variationId!: number;
}
