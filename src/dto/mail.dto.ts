import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MailDto {
  @IsOptional()
  @IsString()
  mail: string;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  content: string;
}
