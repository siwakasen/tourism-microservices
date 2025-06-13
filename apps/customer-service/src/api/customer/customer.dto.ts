import { ApiProperty } from "@nestjs/swagger";
import {  IsBoolean, IsEmail, IsJSON, IsOptional, IsString, IsStrongPassword, MinLength } from "class-validator";

export class RegisterCustomerDto {
  @ApiProperty({
    description: 'The email of the customer',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the customer',
    example: 'Password12!@',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The name of the customer',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The phone number of the customer',
    example: '08123456789',
  })
  @IsString()
  @IsOptional()
  phone_number: string;

  @ApiProperty({
    description: 'The country of the customer',
    example: 'Indonesia',
  })
  @IsString()
  @IsOptional()
  country_origin: string;
}

export class LoginReqDto {
    @ApiProperty({ default: 'john.doe@example.com' })
    @IsEmail()
    email: string;
  
    @ApiProperty({ default: 'Password12!@' })
    @IsString()
    password: string;
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
  @ApiProperty({ default: 'test@gmail.com' })
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

