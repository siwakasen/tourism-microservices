import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  GetExpensesYearlyReportDto, GetExpensesYearComparisonReportDto, GetBookingYearlyRevenueDto, GetBookingYearComparisonRevenueDto, GetProfitAndLossStatementYearlyReportDto, GetProfitAndLossStatementYearComparisonReportDto, GetBookingMonthlyRevenueDto, GetExpensesMonthlyReportDto } from './report.dto';


@ApiBearerAuth()
@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('monthly/bookings')
  getBookingMonthlyRevenue(@Query() payload: GetBookingMonthlyRevenueDto) {
    return this.reportService.getBookingMonthlyRevenue(payload);
  }

  @Get('yearly/bookings')
    getBookingYearlyRevenue(@Query() payload: GetBookingYearlyRevenueDto){
      return this.reportService.getBookingYearlyRevenue(payload);
  }

  @Get('year-comparison/bookings')
  getBookingYearComparisonRevenue(@Query() payload: GetBookingYearComparisonRevenueDto) {
    return this.reportService.getBookingYearComparisonRevenue(payload);
  }

  @Get('monthly/expenses')
  getExpensesMonthlyReport(@Query() payload: GetExpensesMonthlyReportDto) {
    return this.reportService.getExpensesMonthlyReport(payload);
  }

  @Get('yearly/expenses')
  getExpensesYearlyReport(@Query() payload: GetExpensesYearlyReportDto) {
    return this.reportService.getExpensesYearlyReport(payload);
  }

  @Get('year-comparison/expenses')
  getExpensesYearComparisonReport(@Query() payload: GetExpensesYearComparisonReportDto) {
    return this.reportService.getExpensesYearComparisonReport(payload);
  }

  @Get('yearly/profit-loss')
  getProfitAndLossStatementYearlyReport(@Query() payload: GetProfitAndLossStatementYearlyReportDto) {
    return this.reportService.getProfitAndLossStatementYearlyReport(payload);
  }

  @Get('year-comparison/profit-loss')
  getProfitAndLossStatementYearComparisonReport(@Query() payload: GetProfitAndLossStatementYearComparisonReportDto) {
    return this.reportService.getProfitAndLossStatementYearComparisonReport(payload);
  }

}
