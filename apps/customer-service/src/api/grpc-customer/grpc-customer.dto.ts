import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional } from "class-validator";

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
    public readonly phoneNumber: string;
  
    @ApiProperty({
      description: 'The country of the customer',
      example: 'Indonesia',
    })
    @IsString()
    @IsOptional()
    public readonly countryOrigin: string;
  }