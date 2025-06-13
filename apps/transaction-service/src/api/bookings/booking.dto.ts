import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsEmail, IsJSON, IsNumber, IsOptional, IsString } from "class-validator";

export class BookingRegisterReqDto {
  // BOOKING DATA
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  public readonly package_id: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  public readonly car_id: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  public readonly with_driver: boolean;

  @ApiProperty()
  @IsDate()
  public readonly start_date: Date;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  public readonly end_date: Date;

  // CUSTOMER DATA
  @ApiProperty({
    description: 'The email of the customer',
    example: 'john.doe@example.com',
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
    example: 'John Doe',
  })
  @IsString()
  public readonly name: string;

  @ApiProperty({
    description: 'The phone number of the customer',
    example: '08123456789',
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
