import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RefundMetod } from "libs/entities/transactions/refunds.entitiy";

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

export class AddFormDto {
    @ApiProperty({ enum: RefundMetod })
    @IsEnum(RefundMetod)
    public readonly method: RefundMetod;

    @ApiProperty()
    @IsString()
    @IsOptional()
    public readonly bank_name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    public readonly account_number: string;

    @ApiProperty()
    @IsString()
    public readonly account_name: string;
}   