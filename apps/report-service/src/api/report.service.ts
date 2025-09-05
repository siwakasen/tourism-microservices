import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource,  } from 'typeorm';
import {  GetBookingYearlyRevenueDto, GetBookingYearComparisonRevenueDto, GetExpensesYearlyReportDto, GetExpensesYearComparisonReportDto, GetProfitAndLossStatementYearlyReportDto, GetProfitAndLossStatementYearComparisonReportDto, GetBookingMonthlyRevenueDto, GetExpensesMonthlyReportDto } from './report.dto';
import { Bookings, BookingStatus, Expenses, PaymentStatus, Employee } from 'libs/entities';
import { convertUSDToIDR, getExchangeRate } from 'apps/transaction-service/src/common/helper/currency.helper';

@Injectable()
export class ReportService {
  constructor(
    @InjectDataSource('primary')
    private transactionDataSource: DataSource,
    
    @InjectDataSource('secondary')
    private expensesDataSource: DataSource,

    @InjectDataSource('third')
    private employeeDataSource: DataSource,
  ) {}

  public async getBookingMonthlyRevenue(payload: GetBookingMonthlyRevenueDto) {
    const { start_date, end_date } = payload;

    // checkin bookings with no show, completed, and cancelled
    // for cancelled status, check if the payment is not failed (which means the booking is cancelled before payment successful)
    const queryBuilder = this.transactionDataSource.createQueryBuilder(Bookings, 'bookings')
      .leftJoinAndSelect('bookings.payments', 'payments')
      .leftJoinAndSelect('bookings.refunds', 'refunds')
      .where('bookings.start_date >= :start_date', { start_date })
      .andWhere('bookings.end_date <= :end_date', { end_date })
      .andWhere('bookings.status IN (:...statuses)', { statuses: [BookingStatus.NO_SHOW, BookingStatus.CANCELLED, BookingStatus.COMPLETED] })
      .andWhere(`(
        bookings.status != :cancelledStatus 
        OR (
          bookings.status = :cancelledStatus 
          AND (
            SELECT status 
            FROM payments p1
            WHERE p1.booking_id = bookings.id
            AND (
              SELECT COUNT(*) 
              FROM payments p2 
              WHERE p2.booking_id = bookings.id 
              AND p2.id < p1.id
            ) = 0
            LIMIT 1
          ) != :failedStatus
        )
      )`, { cancelledStatus: BookingStatus.CANCELLED, failedStatus: PaymentStatus.FAILED })
      .orderBy('bookings.created_at', 'DESC');

      const [result, total] = await queryBuilder.getManyAndCount();

      const grossRevenue = result.reduce((acc, booking) => acc + booking.total_price, 0);
      const refundCost = result.reduce((acc, booking) => acc + booking.refunds.amount, 0);
      const paymentGatewayCost: number = Number(result.reduce((acc, booking) => acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
      const netRevenue: number = Number((
        result.reduce((acc, booking) => {
          return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
        }, 0 ) - refundCost
      ).toFixed(2));
      const exchangeRate = await getExchangeRate();

      return {
        grossRevenue: Number((grossRevenue * exchangeRate).toFixed(2)),
        refundCost: Number((refundCost * exchangeRate).toFixed(2)),
        paymentGatewayCost: Number((paymentGatewayCost * exchangeRate).toFixed(2)),
        netRevenue: Number((netRevenue * exchangeRate).toFixed(2)),
        totalBookings: total,
        data: result,
      };
  }

 
  public async getBookingYearlyRevenue(payload: GetBookingYearlyRevenueDto) {
    const { year } = payload;
    
    // Create start and end dates for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // Get all bookings for the year
    const queryBuilder = this.transactionDataSource.createQueryBuilder(Bookings, 'bookings')
      .leftJoinAndSelect('bookings.payments', 'payments')
      .leftJoinAndSelect('bookings.refunds', 'refunds')
      .where('bookings.start_date >= :startDate', { startDate })
      .andWhere('bookings.end_date <= :endDate', { endDate })
      .andWhere('bookings.status IN (:...statuses)', { statuses: [BookingStatus.NO_SHOW, BookingStatus.CANCELLED, BookingStatus.COMPLETED] })
      .andWhere(`(
        bookings.status != :cancelledStatus 
        OR (
          bookings.status = :cancelledStatus 
          AND (
            SELECT status 
            FROM payments p1
            WHERE p1.booking_id = bookings.id
            AND (
              SELECT COUNT(*) 
              FROM payments p2 
              WHERE p2.booking_id = bookings.id 
              AND p2.id < p1.id
            ) = 0
            LIMIT 1
          ) != :failedStatus
        )
      )`, { cancelledStatus: BookingStatus.CANCELLED, failedStatus: PaymentStatus.FAILED })
      .orderBy('bookings.created_at', 'DESC');

    const [result, total] = await queryBuilder.getManyAndCount();

    // Calculate yearly totals
    const grossRevenue: number = result.reduce((acc, booking) => acc + booking.total_price, 0);
    const refundCost: number = result.reduce((acc, booking) => acc + (booking.refunds?.amount || 0), 0);
    const paymentGatewayCost: number = Number(result.reduce((acc, booking) => 
      acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
    const netRevenue: number = Number((
      result.reduce((acc, booking) => {
        return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
      }, 0) - refundCost
    ).toFixed(2));
    const exchangeRate = await getExchangeRate();

    // Calculate monthly breakdown
    const monthlyBreakdown = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthBookings = result.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const monthGrossRevenue: number = monthBookings.reduce((acc, booking) => acc + booking.total_price, 0);
      const monthRefundCost: number = monthBookings.reduce((acc, booking) => acc + (booking.refunds?.amount || 0), 0);
      const monthPaymentGatewayCost: number = Number(monthBookings.reduce((acc, booking) => 
        acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
      const monthNetRevenue: number = Number((
        monthBookings.reduce((acc, booking) => {
          return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
        }, 0) - monthRefundCost
      ).toFixed(2));

      monthlyBreakdown.push({
        month: month + 1,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        grossRevenue: Number((monthGrossRevenue * exchangeRate).toFixed(2)),
        refundCost: Number((monthRefundCost * exchangeRate).toFixed(2)),
        paymentGatewayCost: Number((monthPaymentGatewayCost * exchangeRate).toFixed(2)),
        netRevenue: Number((monthNetRevenue * exchangeRate).toFixed(2)),
        bookingCount: monthBookings.length,
        monthBookings: monthBookings
      });
    }


    return {
      year: year,
      totals: {
        grossRevenue: Number((grossRevenue * exchangeRate).toFixed(2)),
        refundCost: Number((refundCost * exchangeRate).toFixed(2)),
        paymentGatewayCost: Number((paymentGatewayCost * exchangeRate).toFixed(2)),
        netRevenue: Number((netRevenue * exchangeRate).toFixed(2)),
      },
      monthlyBreakdown,
      data: result
    };
  }

  public async getBookingYearComparisonRevenue(payload: GetBookingYearComparisonRevenueDto) {
    const { start_year, end_year } = payload;
    
    // Create start and end dates for the year range
    const startDate = new Date(start_year, 0, 1); // January 1st of start year
    const endDate = new Date(end_year, 11, 31, 23, 59, 59); // December 31st of end year

    // Get all bookings for the year range
    const queryBuilder = this.transactionDataSource.createQueryBuilder(Bookings, 'bookings')
      .leftJoinAndSelect('bookings.payments', 'payments')
      .leftJoinAndSelect('bookings.refunds', 'refunds')
      .where('bookings.start_date >= :startDate', { startDate })
      .andWhere('bookings.end_date <= :endDate', { endDate })
      .andWhere('bookings.status IN (:...statuses)', { statuses: [BookingStatus.NO_SHOW, BookingStatus.CANCELLED, BookingStatus.COMPLETED] })
      .andWhere(`(
        bookings.status != :cancelledStatus 
        OR (
          bookings.status = :cancelledStatus 
          AND (
            SELECT status 
            FROM payments p1
            WHERE p1.booking_id = bookings.id
            AND (
              SELECT COUNT(*) 
              FROM payments p2 
              WHERE p2.booking_id = bookings.id 
              AND p2.id < p1.id
            ) = 0
            LIMIT 1
          ) != :failedStatus
        )
      )`, { cancelledStatus: BookingStatus.CANCELLED, failedStatus: PaymentStatus.FAILED })
      .orderBy('bookings.created_at', 'DESC');

    const [result, total] = await queryBuilder.getManyAndCount();

    // Calculate yearly breakdown
    const yearlyBreakdown = [];
    
    for (let year = start_year; year <= end_year; year++) {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      
      // Filter bookings for this specific year
      const yearBookings = result.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        return bookingDate >= yearStart && bookingDate <= yearEnd;
      });

      // Calculate revenue metrics for this year
      const grossRevenue: number = yearBookings.reduce((acc, booking) => acc + booking.total_price, 0);
      const refundCost: number = yearBookings.reduce((acc, booking) => acc + (booking.refunds?.amount || 0), 0);
      const paymentGatewayCost: number = Number(yearBookings.reduce((acc, booking) => 
        acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
      const netRevenue: number = Number((
        yearBookings.reduce((acc, booking) => {
          return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
        }, 0) - refundCost
      ).toFixed(2));

      const exchangeRate = await getExchangeRate();

      yearlyBreakdown.push({
        year: year,
        grossRevenue: Number((grossRevenue * exchangeRate).toFixed(2)),
        refundCost: Number((refundCost * exchangeRate).toFixed(2)),
        paymentGatewayCost: Number((paymentGatewayCost * exchangeRate).toFixed(2)),
        netRevenue: Number((netRevenue * exchangeRate).toFixed(2)),
      });
    }

    return {
      yearlyBreakdown
    };
  }

  public async getExpensesMonthlyReport(payload: GetExpensesMonthlyReportDto) {
    const { start_date, end_date } = payload;

    const queryBuilder = this.expensesDataSource.createQueryBuilder(Expenses, 'expenses')
      .where('expenses.expense_date >= :start_date', { start_date })
      .andWhere('expenses.expense_date <= :end_date', { end_date })
      .orderBy('expenses.expense_date', 'DESC');
    
      const expensesAmount = await queryBuilder.getMany().then(result => result.reduce((acc, expense) => acc + expense.expense_amount, 0));

      const employeeQueryBuilder = this.employeeDataSource.createQueryBuilder(Employee, 'employees')
        .where('employees.created_at <= :end_date', { end_date })
        .orderBy('employees.created_at', 'DESC');

        let employees = await employeeQueryBuilder.getMany();
        employees = employees.filter((employee) => employee.password !== null);
        employees = employees.map(({ password, ...rest }) => rest) as Employee[];
        const salaryCost = employees.reduce((acc, employee) => acc + employee.salary, 0);

    const [result, total] = await queryBuilder.getManyAndCount();

    return {
      totalAmount: salaryCost + expensesAmount,
      employees:{
        salaryCost: salaryCost,
        employeeData: employees,
        employeeCount: employees.length,
      },
      expenses:{
        expensesAmount: expensesAmount,
        expensesData: result,
        expensesCount: total, 
      },

    };
  }

  public async getExpensesYearlyReport(payload: GetExpensesYearlyReportDto) {
    const { year } = payload;
    
    // Create start and end dates for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // Get all expenses for the year
    const queryBuilder = this.expensesDataSource.createQueryBuilder(Expenses, 'expenses')
      .where('expenses.expense_date >= :startDate', { startDate })
      .andWhere('expenses.expense_date <= :endDate', { endDate })
      .orderBy('expenses.expense_date', 'DESC');

    const [expensesResult, expensesTotal] = await queryBuilder.getManyAndCount();
    const expensesCost = expensesResult.reduce((acc, expense) => acc + expense.expense_amount, 0);

    // Get all employees for the year
    const employeeQueryBuilder = this.employeeDataSource.createQueryBuilder(Employee, 'employees')
      .where('employees.created_at <= :endDate', { endDate })
      .orderBy('employees.created_at', 'DESC');

    let allEmployees = await employeeQueryBuilder.getMany();
    allEmployees = allEmployees.filter((employee) => employee.password !== null);
    allEmployees = allEmployees.map(({ password, ...rest }) => rest) as Employee[];

    // Calculate yearly salary cost (only for employees active during the year)
    const salaryCost = allEmployees.reduce((acc, employee) => acc + employee.salary, 0);

    // Calculate monthly breakdown
    const monthlyBreakdown = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      
      // Filter expenses for this month
      const monthExpenses = expensesResult.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const monthExpensesCost = monthExpenses.reduce((acc, expense) => acc + expense.expense_amount, 0);
      
      // Filter employees who were active during this month (created before or during the month)
      const monthEmployees = allEmployees.filter(employee => {
        const employeeCreatedAt = new Date(employee.created_at);
        return employeeCreatedAt <= monthEnd;
      });
      
      const monthSalaryCost = monthEmployees.reduce((acc, employee) => acc + employee.salary, 0);
      
      monthlyBreakdown.push({
        month: month + 1,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        totalCost: monthSalaryCost + monthExpensesCost,
        employees: {
          salaryCost: monthSalaryCost,
          employeeData: monthEmployees,
          employeeCount: monthEmployees.length,
        },
        expenses: {
          expensesCost: monthExpensesCost,
          expensesData: monthExpenses,
          expensesCount: monthExpenses.length,
        },
      });
    }

    return {
      year: year,
      totals: {
        totalCost: salaryCost + expensesCost,
        employees: {
          salaryCost,
          employeeCount: allEmployees.length,
        },
        expenses: {
          expensesCost,
          expensesCount: expensesTotal,
        },
      },
      monthlyBreakdown,
    };
  }

  public async getExpensesYearComparisonReport(payload: GetExpensesYearComparisonReportDto) {
    const { start_year, end_year } = payload;
    
    // Create start and end dates for the year range
    const startDate = new Date(start_year, 0, 1); // January 1st of start year
    const endDate = new Date(end_year, 11, 31, 23, 59, 59); // December 31st of end year

    // Get all expenses for the year range
    const expensesQueryBuilder = this.expensesDataSource.createQueryBuilder(Expenses, 'expenses')
      .where('expenses.expense_date >= :startDate', { startDate })
      .andWhere('expenses.expense_date <= :endDate', { endDate })
      .orderBy('expenses.expense_date', 'DESC');

    const [expensesResult, expensesTotal] = await expensesQueryBuilder.getManyAndCount();

    // Get all employees (filter out those without passwords - inactive employees)
    const employeeQueryBuilder = this.employeeDataSource.createQueryBuilder(Employee, 'employees')
      .where('employees.created_at <= :endDate', { endDate })
      .orderBy('employees.created_at', 'DESC');

    let allEmployees = await employeeQueryBuilder.getMany();
    allEmployees = allEmployees.filter((employee) => employee.password !== null);
    allEmployees = allEmployees.map(({ password, ...rest }) => rest) as Employee[];

    // Calculate yearly breakdown
    const yearlyBreakdown = [];
    
    for (let year = start_year; year <= end_year; year++) {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      
      // Filter expenses for this specific year
      const yearExpenses = expensesResult.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= yearStart && expenseDate <= yearEnd;
      });
      
      const expensesCost = yearExpenses.reduce((acc, expense) => acc + expense.expense_amount, 0);
      
      // Filter employees who were active during this year (created before or during the year)
      const yearEmployees = allEmployees.filter(employee => {
        const employeeCreatedAt = new Date(employee.created_at);
        return employeeCreatedAt <= yearEnd;
      });
      
      const salaryCost = yearEmployees.reduce((acc, employee) => acc + employee.salary, 0);
      const totalCost = salaryCost + expensesCost;

      yearlyBreakdown.push({
        year: year,
        totalCost,
        salaryCost,
        expensesCost
      });
    }

    return {
      yearlyBreakdown
    };
  }

  public async getProfitAndLossStatementYearlyReport(payload: GetProfitAndLossStatementYearlyReportDto) {
    const { year } = payload;

    // Create start and end dates for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // Get all bookings for the year (revenue data)
    const bookingsQueryBuilder = this.transactionDataSource.createQueryBuilder(Bookings, 'bookings')
      .leftJoinAndSelect('bookings.payments', 'payments')
      .leftJoinAndSelect('bookings.refunds', 'refunds')
      .where('bookings.start_date >= :startDate', { startDate })
      .andWhere('bookings.end_date <= :endDate', { endDate })
      .andWhere('bookings.status IN (:...statuses)', { statuses: [BookingStatus.NO_SHOW, BookingStatus.CANCELLED, BookingStatus.COMPLETED] })
      .andWhere(`(
        bookings.status != :cancelledStatus 
        OR (
          bookings.status = :cancelledStatus 
          AND (
            SELECT status 
            FROM payments p1
            WHERE p1.booking_id = bookings.id
            AND (
              SELECT COUNT(*) 
              FROM payments p2 
              WHERE p2.booking_id = bookings.id 
              AND p2.id < p1.id
            ) = 0
            LIMIT 1
          ) != :failedStatus
        )
      )`, { cancelledStatus: BookingStatus.CANCELLED, failedStatus: PaymentStatus.FAILED })
      .orderBy('bookings.created_at', 'DESC');

    const [bookingsResult, bookingsTotal] = await bookingsQueryBuilder.getManyAndCount();

    // Get all expenses for the year
    const expensesQueryBuilder = this.expensesDataSource.createQueryBuilder(Expenses, 'expenses')
      .where('expenses.expense_date >= :startDate', { startDate })
      .andWhere('expenses.expense_date <= :endDate', { endDate })
      .orderBy('expenses.expense_date', 'DESC');

    const [expensesResult, expensesTotal] = await expensesQueryBuilder.getManyAndCount();

    // Get all employees (filter out those without passwords - inactive employees)
    const employeeQueryBuilder = this.employeeDataSource.createQueryBuilder(Employee, 'employees')
      .where('employees.created_at <= :endDate', { endDate })
      .orderBy('employees.created_at', 'DESC');

    let allEmployees = await employeeQueryBuilder.getMany();
    allEmployees = allEmployees.filter((employee) => employee.password !== null);
    allEmployees = allEmployees.map(({ password, ...rest }) => rest) as Employee[];

    // Calculate monthly profit/loss breakdown
    const monthlyBreakdown = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      
      // Filter bookings for this month
      const monthBookings = bookingsResult.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      // Calculate revenue for this month
      const grossRevenue: number = monthBookings.reduce((acc, booking) => acc + booking.total_price, 0);
      const refundCost: number = monthBookings.reduce((acc, booking) => acc + (booking.refunds?.amount || 0), 0);
      const paymentGatewayCost: number = Number(monthBookings.reduce((acc, booking) => 
        acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
      const netRevenue: number = Number((
        monthBookings.reduce((acc, booking) => {
          return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
        }, 0) - refundCost
      ).toFixed(2));

      // Filter expenses for this month
      const monthExpenses = expensesResult.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const expensesCost = monthExpenses.reduce((acc, expense) => acc + expense.expense_amount, 0);
      
      // Filter employees who were active during this month
      const monthEmployees = allEmployees.filter(employee => {
        const employeeCreatedAt = new Date(employee.created_at);
        return employeeCreatedAt <= monthEnd;
      });
      
      const salaryCost = monthEmployees.reduce((acc, employee) => acc + employee.salary, 0);
      const totalCost = salaryCost + expensesCost;

      // Calculate profit/loss
      const profitLoss = Number((netRevenue - totalCost).toFixed(2));

      monthlyBreakdown.push({
        month: month + 1,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        revenue: {
          grossRevenue,
          refundCost,
          paymentGatewayCost,
          netRevenue
        },
        costs: {
          salaryCost,
          expensesCost,
          totalCost
        },
        profitLoss
      });
    }

    return {
      year: year,
      monthlyBreakdown
    };
  }


  public async getProfitAndLossStatementYearComparisonReport(payload: GetProfitAndLossStatementYearComparisonReportDto) {
    const { start_year, end_year } = payload;
    
    // Create start and end dates for the year range
    const startDate = new Date(start_year, 0, 1); // January 1st of start year
    const endDate = new Date(end_year, 11, 31, 23, 59, 59); // December 31st of end year

    // Get all bookings for the year range (revenue data)
    const bookingsQueryBuilder = this.transactionDataSource.createQueryBuilder(Bookings, 'bookings')
      .leftJoinAndSelect('bookings.payments', 'payments')
      .leftJoinAndSelect('bookings.refunds', 'refunds')
      .where('bookings.start_date >= :startDate', { startDate })
      .andWhere('bookings.end_date <= :endDate', { endDate })
      .andWhere('bookings.status IN (:...statuses)', { statuses: [BookingStatus.NO_SHOW, BookingStatus.CANCELLED, BookingStatus.COMPLETED] })
      .andWhere(`(
        bookings.status != :cancelledStatus 
        OR (
          bookings.status = :cancelledStatus 
          AND (
            SELECT status 
            FROM payments p1
            WHERE p1.booking_id = bookings.id
            AND (
              SELECT COUNT(*) 
              FROM payments p2 
              WHERE p2.booking_id = bookings.id 
              AND p2.id < p1.id
            ) = 0
            LIMIT 1
          ) != :failedStatus
        )
      )`, { cancelledStatus: BookingStatus.CANCELLED, failedStatus: PaymentStatus.FAILED })
      .orderBy('bookings.created_at', 'DESC');

    const [bookingsResult, bookingsTotal] = await bookingsQueryBuilder.getManyAndCount();

    // Get all expenses for the year range
    const expensesQueryBuilder = this.expensesDataSource.createQueryBuilder(Expenses, 'expenses')
      .where('expenses.expense_date >= :startDate', { startDate })
      .andWhere('expenses.expense_date <= :endDate', { endDate })
      .orderBy('expenses.expense_date', 'DESC');

    const [expensesResult, expensesTotal] = await expensesQueryBuilder.getManyAndCount();

    // Get all employees (filter out those without passwords - inactive employees)
    const employeeQueryBuilder = this.employeeDataSource.createQueryBuilder(Employee, 'employees')
      .where('employees.created_at <= :endDate', { endDate })
      .orderBy('employees.created_at', 'DESC');

    let allEmployees = await employeeQueryBuilder.getMany();
    allEmployees = allEmployees.filter((employee) => employee.password !== null);
    allEmployees = allEmployees.map(({ password, ...rest }) => rest) as Employee[];

    // Calculate yearly profit/loss breakdown
    const yearlyBreakdown = [];
    
    for (let year = start_year; year <= end_year; year++) {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      
      // Filter bookings for this specific year
      const yearBookings = bookingsResult.filter(booking => {
        const bookingDate = new Date(booking.start_date);
        return bookingDate >= yearStart && bookingDate <= yearEnd;
      });

      // Calculate revenue for this year
      const grossRevenue: number = yearBookings.reduce((acc, booking) => acc + booking.total_price, 0);
      const refundCost: number = yearBookings.reduce((acc, booking) => acc + (booking.refunds?.amount || 0), 0);
      const paymentGatewayCost: number = Number(yearBookings.reduce((acc, booking) => 
        acc + (booking.payments.reduce((sum, payment) => sum + (payment.gross_amount - payment.net_amount || 0), 0)), 0).toFixed(2));
      const netRevenue: number = Number((
        yearBookings.reduce((acc, booking) => {
          return acc + booking.payments.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
        }, 0) - refundCost
      ).toFixed(2));

      // Filter expenses for this specific year
      const yearExpenses = expensesResult.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= yearStart && expenseDate <= yearEnd;
      });
      
      const expensesCost = yearExpenses.reduce((acc, expense) => acc + expense.expense_amount, 0);
      
      // Filter employees who were active during this year
      const yearEmployees = allEmployees.filter(employee => {
        const employeeCreatedAt = new Date(employee.created_at);
        return employeeCreatedAt <= yearEnd;
      });
      
      const salaryCost = yearEmployees.reduce((acc, employee) => acc + employee.salary, 0);
      const totalCost = salaryCost + expensesCost;

      // Calculate profit/loss
      const profitLoss = Number((netRevenue - totalCost).toFixed(2));

      yearlyBreakdown.push({
        year: year,
        revenue: {
          grossRevenue,
          refundCost,
          paymentGatewayCost,
          netRevenue
        },
        costs: {
          salaryCost,
          expensesCost,
          totalCost
        },
        profitLoss
      });
    }

    return {
      yearlyBreakdown
    };
  }

}
