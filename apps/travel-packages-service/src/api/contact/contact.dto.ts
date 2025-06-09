import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class sentContactDto {
  @ApiProperty()
  @IsString()
  public readonly name: string;

  @ApiProperty()
  @IsEmail()
  public readonly email: string;

  @ApiProperty()
  @IsString()
  public readonly subject: string;
  @ApiProperty()
  @IsString()
  public readonly message: string;
}
