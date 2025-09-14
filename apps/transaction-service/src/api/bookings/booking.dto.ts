import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Bookings, BookingStatus, PaymentMethod } from 'libs/entities';

export class BookingReqDto {
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

  @ApiProperty({
    description: 'The start date of the booking',
    example: new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
  })
  @IsDate()
  @Type(() => Date)
  public readonly start_date: Date;

  @ApiProperty({
    description: 'The end date of the booking',
    example: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2),
  })
  @IsDate()
  @Type(() => Date)
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

  @ApiProperty({
    description: 'The additional notes of the booking',
    example: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  public readonly additional_notes: string;
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
}

export class BookingWithoutRegisterResDto {
  @ApiProperty({ default: { message: 'Booking success' } })
  @IsJSON()
  public readonly data: {
    message: string;
    token: string;
    redirect_url: string;
  };
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
  @ApiProperty({
    default: {
      data: [],
      meta: {
        totalItems: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  })
  @IsJSON()
  public readonly data: Bookings[];

  @ApiProperty({
    default: {
      totalItems: 0,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  })
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
}

export class FinishBookingDto {
  @ApiProperty({
    enum: [BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
    description: 'Status can only be COMPLETED or NO_SHOW',
    example: BookingStatus.COMPLETED,
  })
  @IsIn([BookingStatus.COMPLETED, BookingStatus.NO_SHOW], {
    message: 'Status must be either COMPLETED or NO_SHOW',
  })
  public readonly status: BookingStatus.COMPLETED | BookingStatus.NO_SHOW;
}
