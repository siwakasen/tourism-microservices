import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

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

export class CreateRatingDto {
  @ApiProperty({
    description: 'The booking id of the rating',
    example: 1,
    required: true,
  })
  @IsNumber()
  public readonly booking_id: number;

  @ApiProperty({
    description: 'The service rate of the rating',
    example: 5,
    required: true,
  })
  @Type(() => Number)
  @Min(1)
  @Max(5)
  public readonly service_rate: number;

  @ApiProperty({
    description: 'The description of the rating',
    example: 'The service is good',
    required: false,
  })
  @IsString()
  @IsOptional()
  public readonly description: string;
}
