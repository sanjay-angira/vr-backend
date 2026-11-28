import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean, IsEmail, MaxLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @ApiProperty({ maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    example: true,
    description: 'Confirms consent to receive newsletter emails.',
  })
  @IsBoolean()
  @Equals(true)
  consent!: boolean;
}
