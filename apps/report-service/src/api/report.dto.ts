import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";


export class GetBookingMonthlyRevenueDto {
  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString() })
  @IsDate()
  @Type(() => Date)
  public readonly start_date: Date;

  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() })
  @IsDate()
  @Type(() => Date)
  public readonly end_date: Date;
}

export class GetBookingYearlyRevenueDto { 
  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly year: number;
}

export class GetBookingYearComparisonRevenueDto {
  @ApiProperty({ default: 2020 })
  @IsNumber()
  @Type(() => Number)
  public readonly start_year: number;

  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly end_year: number;
}

export class GetExpensesMonthlyReportDto {
  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString() })
  @IsDate()
  @Type(() => Date)
  public readonly start_date: Date;
  
  @ApiProperty({ default: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() })
  @IsDate()
  @Type(() => Date)
  public readonly end_date: Date;
}


export class GetExpensesYearlyReportDto {
  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly year: number;
}

export class GetExpensesYearComparisonReportDto {
  @ApiProperty({ default: 2020 })
  @IsNumber()
  @Type(() => Number)
  public readonly start_year: number;

  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly end_year: number;
}



export class GetProfitAndLossStatementYearlyReportDto {
  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly year: number;
}

export class GetProfitAndLossStatementYearComparisonReportDto {
  @ApiProperty({ default: 2020 })
  @IsNumber()
  @Type(() => Number)
  public readonly start_year: number;

  @ApiProperty({ default: 2025 })
  @IsNumber()
  @Type(() => Number)
  public readonly end_year: number;
}