import { IsNumber, IsOptional, IsString } from "class-validator";

export class PaginationDto {
    @IsNumber()
    @IsOptional()
    public page: number = 1;

    @IsNumber()
    @IsOptional()
    public limit: number = 10;

    @IsString()
    @IsOptional()
    public search: string = '';
}