import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, IsIn, IsNotEmpty, IsDate } from "class-validator";
import { AdjustmentStatus } from "libs/entities";

export class CancelBookingReqDto {
    @ApiProperty({
      description: 'The reason for the cancellation',
      example: 'I want to cancel the booking',
    })
    @IsString()
    public readonly reason: string;
  }

export class RescheduleBookingReqDto{
  @ApiProperty({
    description: 'The start date of the booking',
    example: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2),
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  public readonly new_start_date: Date;

  @ApiProperty({
    description: 'The end date of the booking',
    example: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 3),
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  public readonly new_end_date: Date;
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

  export class ApproveRejectCancellationDto {
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

  export class ApprovementRescheduleDto {
    @ApiProperty({ 
      enum: [AdjustmentStatus.APPROVED, AdjustmentStatus.REJECTED],
      description: 'Status can only be APPROVED or REJECTED',
      example: AdjustmentStatus.APPROVED
    })
    @IsIn([AdjustmentStatus.APPROVED, AdjustmentStatus.REJECTED], {
      message: 'Status must be either APPROVED or REJECTED'
    })
    public readonly status: AdjustmentStatus.APPROVED | AdjustmentStatus.REJECTED;

    @ApiProperty({
      description: 'The employee id',
      example: 1
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    public readonly employee_id: number;
  }