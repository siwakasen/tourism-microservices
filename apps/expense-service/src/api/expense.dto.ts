import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsString, IsOptional, IsDate } from "class-validator";

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

export class CreateUpdateExpenseDto {
    @ApiProperty({ description: 'The name of the expense', example: 'Hotel' })
    @IsString()
    public readonly expense_name: string;

    @ApiProperty({ description: 'The amount of the expense', example: 100 })
    @IsNumber()
    public readonly expense_amount: number;

    @ApiProperty({ description: 'The date of the expense', example: '2025-01-14' })
    @IsString()
    public readonly expense_date: string;
}

