import { ApiProperty } from "@nestjs/swagger";
import {  IsArray, IsBoolean, IsEmail, IsJSON, IsNumber, IsOptional, IsString, IsStrongPassword, MinLength } from "class-validator";

export class RegisterCustomerDto {
  @ApiProperty({
    description: 'The email of the customer',
    example: 'example@gmail.com',
  })
  @IsEmail()
  public readonly email: string;

  @ApiProperty({
    description: 'The password of the customer',
    example: 'Password12!@',
  })
  @IsString()
  public readonly password: string;

  @ApiProperty({
    description: 'The name of the customer',
    example: 'Example',
  })
  @IsString()
  public readonly name: string;

  @ApiProperty({
    description: 'The phone number of the customer',
    example: '081234567890',
  })
  @IsString()
  @IsOptional()
  public readonly phone_number: string;

  @ApiProperty({
    description: 'The country of the customer',
    example: 'Indonesia',
  })
  @IsString()
  @IsOptional()
  public readonly country_origin: string;
}

export class RegisterCustomerResDto {
  @ApiProperty({ default: { message: 'Register success', token: 'token', id: 1 } })
  @IsJSON()
  public readonly data: {
    message: string;
    token: string;
    id: number;
  };

  @ApiProperty({ default: true })
  @IsBoolean()
  public readonly success: boolean;
}

export class UploadIdentityFileDto {
  @ApiProperty({
    description: 'The identity file of the customer',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsArray()
  public readonly 'identity-file': string[];
}

export class LoginReqDto {
    @ApiProperty({ default: 'example@gmail.com' })
    @IsEmail()
    public readonly email: string;
  
    @ApiProperty({ default: 'Password12!@' })
    @IsString()
    public readonly password: string;
  }

  export class LoginResDto {
      @ApiProperty({ default: { message: 'Login success', token: 'token' } })
      @IsJSON()
      public readonly data: {
        message: string;
        token: string;
      };  

      @ApiProperty({ default: true })
      @IsBoolean()
      public readonly success: boolean;
  }

export class requestResetPasswordDto {
  @ApiProperty({ default: 'example@gmail.com' })
  @IsEmail()
  public readonly email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  public readonly token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  public readonly password: string;
}

