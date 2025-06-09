import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

//set up pagination + filter untuk fetch data staff
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

export class updateThumbnailDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image to be uploaded',
  })
  public readonly image: any;
}

export class DeleteImagesDto {
  @ApiProperty()
  @IsString()
  public readonly imagePath: string;
}
export class CreateUpdateTourPackageDto {
  @ApiProperty()
  @IsString()
  public readonly package_name: string;

  @ApiProperty()
  @IsString()
  public readonly description: string;

  @ApiProperty()
  @IsNumber()
  public readonly package_price: number;

  @ApiProperty()
  @IsNumber()
  public readonly duration: number;

  @ApiProperty()
  @IsNumber()
  public readonly max_group_size: number;

  @ApiProperty()
  @IsNumber()
  public readonly children_price: number;

  @ApiProperty()
  @IsArray()
  public readonly itineraries: string[];

  @ApiProperty()
  @IsArray()
  public readonly includes: string[];

  @ApiProperty()
  @IsArray()
  public readonly pickup_areas: string[];

  @ApiProperty()
  @IsArray()
  public readonly terms_conditions: string[];
}

export class updateStatusDto {
  @ApiProperty()
  @IsBoolean()
  public readonly status: boolean;
}
