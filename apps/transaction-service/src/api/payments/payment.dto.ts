import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class CapturePaymentPaypalDto {
    @ApiProperty({
        description: 'The order id of the payment',
        example: '121',
    })
    @IsString()
    public orderId: string;
}