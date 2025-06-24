import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, IsIn } from "class-validator";
import { AdjustmentStatus } from "libs/entities";

export class CancelBookingReqDto {
    @ApiProperty({
      description: 'The reason for the cancellation',
      example: 'I want to cancel the booking',
    })
    @IsString()
    public readonly reason: string;
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

  export class ApproveRejectAdjustmentDto {
    @ApiProperty({ 
      enum: [AdjustmentStatus.APPROVED, AdjustmentStatus.REJECTED],
      description: 'Status can only be APPROVED or REJECTED',
      example: AdjustmentStatus.APPROVED
    })
    @IsIn([AdjustmentStatus.APPROVED, AdjustmentStatus.REJECTED], {
      message: 'Status must be either APPROVED or REJECTED'
    })
    public readonly status: AdjustmentStatus.APPROVED | AdjustmentStatus.REJECTED;
  }