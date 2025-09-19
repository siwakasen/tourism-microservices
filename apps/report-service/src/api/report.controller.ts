import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  GetExpensesYearlyReportDto,
  GetExpensesYearComparisonReportDto,
  GetBookingYearlyRevenueDto,
  GetBookingYearComparisonRevenueDto,
  GetProfitAndLossStatementYearlyReportDto,
  GetProfitAndLossStatementYearComparisonReportDto,
  GetBookingMonthlyRevenueDto,
  GetExpensesMonthlyReportDto,
} from './report.dto';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';

@ApiBearerAuth()
@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('monthly/bookings')
  getBookingMonthlyRevenue(@Query() payload: GetBookingMonthlyRevenueDto) {
    return this.reportService.getBookingMonthlyRevenue(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('yearly/bookings')
  getBookingYearlyRevenue(@Query() payload: GetBookingYearlyRevenueDto) {
    return this.reportService.getBookingYearlyRevenue(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('year-comparison/bookings')
  getBookingYearComparisonRevenue(
    @Query() payload: GetBookingYearComparisonRevenueDto
  ) {
    return this.reportService.getBookingYearComparisonRevenue(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('monthly/expenses')
  getExpensesMonthlyReport(@Query() payload: GetExpensesMonthlyReportDto) {
    return this.reportService.getExpensesMonthlyReport(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('yearly/expenses')
  getExpensesYearlyReport(@Query() payload: GetExpensesYearlyReportDto) {
    return this.reportService.getExpensesYearlyReport(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('year-comparison/expenses')
  getExpensesYearComparisonReport(
    @Query() payload: GetExpensesYearComparisonReportDto
  ) {
    return this.reportService.getExpensesYearComparisonReport(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('yearly/profit-loss')
  getProfitAndLossStatementYearlyReport(
    @Query() payload: GetProfitAndLossStatementYearlyReportDto
  ) {
    return this.reportService.getProfitAndLossStatementYearlyReport(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @Get('year-comparison/profit-loss')
  getProfitAndLossStatementYearComparisonReport(
    @Query() payload: GetProfitAndLossStatementYearComparisonReportDto
  ) {
    return this.reportService.getProfitAndLossStatementYearComparisonReport(
      payload
    );
  }
}
