import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';

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

export class AvailableCarsDto extends PaginationDto {
  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString() })
  @IsString()
  public readonly start_date: string;

  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() })
  @IsString()
  public readonly end_date: string;
  
}

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image to be uploaded',
  })
  public readonly image: any;
}

export class CreateUpdateCarsDto {
  @ApiProperty({
    description: 'The name of the car',
    example: 'Toyota Corolla',
  })
  @IsString()
  public readonly car_name: string;

  @ApiProperty({
    description: 'The color of the car',
    example: 'Red',
  })
  @IsString()
  public readonly car_color: string;

  @ApiProperty({
    description: 'The police number of the car',
    example: 'AB1234KAE',
  })  
  @IsString()
  public readonly police_number: string;

  @ApiProperty({
    description: 'The transmission of the car',
    example: 'AUTO',
  })
  @IsString()
  public readonly transmission: 'AUTO' | 'MANUAL';

  @ApiProperty({
    description: 'The description of the car',
    example: 'The car is a Toyota Corolla',
  })
  @IsString()
  public readonly description: string;

  @ApiProperty({
    description: 'The maximum number of persons the car can hold',
    example: 4,
  })
  @IsNumber()
  public readonly max_persons: number;

  @ApiProperty({
    description: 'The price per day of the car',
    example: 100000,
  })
  @IsNumber()
  @Type(() => Number)
  public readonly price_per_day: number;

  @ApiProperty({
    description: 'The includes of the car',
    example: ['Air Conditioner', 'Power Steering', 'Power Windows'],
  })
  @IsArray()
  public readonly includes: string[];
}

