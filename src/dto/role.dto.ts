import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsNotEmpty({ message: 'Role name is required' })
  @IsString()
  roleName: string;
}

export class UpdateRoleDto {
  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsString()
  @IsOptional()
  roleName?: string;
}
