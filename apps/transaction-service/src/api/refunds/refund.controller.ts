import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RefundService } from "./refund.service";
import { PaginationDto } from "./refund.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/helpers/auth/user/auth.guard";
import { Roles, UserType } from "@app/helpers/auth/decorators/auth.decorator";


@Controller('refunds')
@ApiBearerAuth()
export class RefundController {
    constructor(private readonly refundService: RefundService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    async getAllRefund(@Query() paginationDto: PaginationDto) {
        return this.refundService.getAllRefund(paginationDto);
    }

    
}