import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsEnum, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { Bookings, PaymentMethod } from "libs/entities";


export class BookingReqDto{
  @ApiProperty({
    description: 'The package id of the booking',
    example: 6,
  })
  @IsNumber()
  @IsOptional()
  public readonly package_id: number;

  @ApiProperty({
    description: 'The car id of the booking',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  public readonly car_id: number;

  @ApiProperty({
    description: 'The with driver of the booking',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  public readonly with_driver: boolean;


  @ApiProperty({
    description: 'The number of persons of the booking',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  public readonly number_of_persons: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  public readonly start_date: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  public readonly end_date: Date;

  @ApiProperty({
    description: 'The payment method of the booking',
    example: 'MIDTRANS',
  })
  @IsEnum(PaymentMethod)
  public readonly payment_method: PaymentMethod;

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
    example: 'siwakasen@gmail.com',
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
    example: 'Siwa Kasen',
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

export class BookingRegisterReqDto extends BookingReqDto {
  @ApiProperty({
    description: 'The email of the customer',
    example: 'siwakasen@gmail.com',
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
    example: 'Siwa Kasen',
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
    redirect_url: string;
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
    token: string;
    redirect_url: string;
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
  public readonly data: {
    bookings: Bookings;
    package_name?: string;
    car_name?: string;
  }[];

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

export class AssignEmployeeDto {
  @ApiProperty({
    description: 'The employee id of the booking',
    example: 1,
  })
  @IsNumber()
  public readonly employee_id: number;

  @ApiProperty({
    description: 'The booking id of the booking',
    example: 1,
  })
  @IsNumber()
  public readonly booking_id: number;
}