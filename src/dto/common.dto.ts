import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  pageNumber?: string;

  @IsString()
  @IsOptional()
  pageSize?: string;

  @IsString()
  @IsOptional()
  column?: string;

  @IsString()
  @IsOptional()
  order?: string;
}

export class IdDto {
  @IsNotEmpty({ message: 'Id is required' })
  @IsNumber()
  id!: number;
}
