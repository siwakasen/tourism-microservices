import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsString, IsOptional } from "class-validator";

export class PaginationExpensesDto {
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

    @ApiProperty({ default: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), required: false })
    @IsString()
    @IsOptional()
    public readonly start_date: string;

    @ApiProperty({ default: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(), required: false })
    @IsString()
    @IsOptional()
    public readonly end_date: string;
}

export class CreateUpdateExpensesDto {
    @ApiProperty({ description: 'The name of the expenses', example: 'Hotel' })
    @IsString()
    public readonly expense_name: string;

    @ApiProperty({ description: 'The amount of the expenses', example: 100 })
    @IsNumber()
    public readonly expense_amount: number;

    @ApiProperty({ description: 'The date of the expenses', example: '2025-01-14' })
    @IsString()
    public readonly expense_date: string;

}

