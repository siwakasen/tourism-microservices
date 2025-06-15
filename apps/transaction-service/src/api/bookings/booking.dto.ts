import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsJSON, IsNumber, IsOptional, IsString } from "class-validator";
import { Bookings } from "libs/entities";

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

  @ApiProperty({
    description: 'The pickup location of the customer',
    example: 'Hotel Kuta',
  })
  @IsString()
  @IsOptional()
  public readonly pickup_location: string;

  @ApiProperty({
    description: 'The pickup time of the customer',
    example: '10:00',
  })
  @IsString()
  @IsOptional()
  public readonly pickup_time: string;
}
 
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


export class BookingRegisterResDto {
  @ApiProperty({ default: { message: 'Booking success', token: 'token' } })
  @IsJSON()
  public readonly data: {
    message: string;
    token: string;
  };  

  @ApiProperty({ default: true })
  @IsBoolean()
  public readonly success: boolean;
}

export class BookingWithoutRegisterResDto {
  @ApiProperty({ default: { message: 'Booking success' } })
  @IsJSON()
  public readonly data: {
    message: string;
  };

  @ApiProperty({ default: true })
  @IsBoolean()
  public readonly success: boolean;
}
export class PaginationDto {
  @ApiProperty({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  public readonly page: number;

  @ApiProperty({ default: 10 })
  @IsNumber()
  @Type(() => Number)
  public readonly limit: number;

  @ApiProperty({ default: '', required: false })
  @IsString()
  @IsOptional()
  public readonly search: string;
}

export class BookingResDto {
  @ApiProperty({ default: { data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 1, limit: 10, hasNextPage: false, hasPrevPage: false } } })
  @IsJSON()
  public readonly data: Bookings[];

  @ApiProperty({ default: { totalItems: 0, currentPage: 1, totalPages: 1, limit: 10, hasNextPage: false, hasPrevPage: false } })
  @IsJSON()
  public readonly meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}