import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';

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
export class UploadImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Array of images to be uploaded',
  })
  @IsArray()
  public readonly images: any[];
}

export class DeleteImagesDto {
  @ApiProperty()
  @IsString()
  public readonly imagePath: string;
}

export class CreateUpdateTravelPackageDto {
  @ApiProperty({
    description: 'The name of the travel package',
    example: 'Bali Island Adventure',
  })
  @IsString()
  public readonly package_name: string;

  @ApiProperty({
    description: 'The detailed description of the travel package',
    example: 'Experience the beauty of Bali with a 3-day adventure package.',
  })
  @IsString()
  public readonly description: string;

  @ApiProperty({
    description: 'The price of the travel package in USD',
    example: 1500,
  })
  @IsNumber()
  public readonly package_price: number;

  @ApiProperty({
    description: 'The duration of the travel package in hours',
    example: 4,
  })
  @IsNumber()
  public readonly duration: number;

  @ApiProperty({
    description: 'The maximum number of persons for the travel package',
    example: 10,
  })
  @IsNumber()
  public readonly max_persons: number;

  @ApiProperty({
    description: 'The detailed itineraries for the travel package',
    example: [
      'Day 1: Arrival in Bali, Check-in at hotel, Welcome dinner at local restaurant',
      'Day 2: Full-day tour of Ubud including Temples, Waterfalls, and Traditional Village',
      'Day 3: Departure from Bali',
    ],
  })
  @IsArray()
  public readonly itineraries: string[];

  @ApiProperty({
    description: 'The list of items included in the travel package',
    example: '["Tickets", "Bottle water", "Tour Guide"]',
  })
  @IsArray()
  public readonly includes: string[];
}

export class UploadThumbnailDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Thumbnail image to be uploaded',
  })
  public readonly thumbnail: any;
}
