import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'adm@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'adminadmin' })
  @IsString()
  @MinLength(1)
  senha!: string;
}
