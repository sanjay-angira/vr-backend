import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// update-cart.dto.ts
export class UpdateCartDto {
  @IsNotEmpty()
  @IsNumber()
  cartItemId!: number;

  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

// add-to-cart.dto.ts
export class AddToCartDto {
  @IsNotEmpty()
  @IsNumber()
  variationId!: number;

  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
