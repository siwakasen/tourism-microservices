import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RefundService } from "./refund.service";
import { AddFormDto, PaginationDto } from "./refund.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/helpers/auth/user/auth.guard";
import { Roles, UserType } from "@app/helpers/auth/decorators/auth.decorator";
import { GetCustomer } from "@app/helpers/auth/decorators/get-user.decorator";
import { Customer } from "libs/entities/customer/customer.entity";
import { RefundMethod } from "libs/entities/transactions/refunds.entitiy";


@Controller('refunds')
@ApiBearerAuth()
@ApiTags('Refund Controller')
export class RefundController {
    constructor(private readonly refundService: RefundService) {}


    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    @ApiBearerAuth()
    async getRefundByIdBooking(@Param('id') id: number, @GetCustomer() customer: Customer) {
        return this.refundService.getRefundById(customer.id, id);
    }

    @Get('data/all')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.OWNER)
    @ApiBearerAuth()
    async getAllRefund(@Query() query: PaginationDto) {
        return this.refundService.getAllRefund(query);
    }

    @Patch('save-form/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.CUSTOMER)
    @ApiBearerAuth()
    async saveFormCustomer(@Param('id') id: number, @Body() body: AddFormDto, @GetCustomer() customer: Customer) {
        return this.refundService.saveForm(body, customer.id, id);
    }

    @Patch('complete/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.OWNER)
    @ApiBearerAuth()
    async completeRefund(@Param('id') id: number) {
        return this.refundService.completeRefund(id);
    }

    
}