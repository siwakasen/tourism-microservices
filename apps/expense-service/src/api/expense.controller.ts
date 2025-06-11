import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateUpdateExpenseDto, PaginationDto } from './expense.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { GetEmployee } from '@app/helpers/auth/decorators/get-user.decorator';
import { Employee } from 'libs/entities/employees';

@ApiTags('Expense')
@ApiBearerAuth()
@Controller('expense')
export class ExpenseController {
  @Inject(ExpenseService)
  private readonly expenseService: ExpenseService;

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data expenses',
  })
  @Get()
  public async getAllExpenses(@Query() query: PaginationDto) {
    console.log(query);
    return this.expenseService.getAllExpenses(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data expense by id',
  })
  @Get(':id')
  public async getExpenseById(@Param('id') id: number) {
    return this.expenseService.getExpenseById(id);
  }


  @ApiResponse({
    status: 200,
    description: 'Successfuly create data expense',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post()
  public async createExpense(
    @Body() body: CreateUpdateExpenseDto,
    @GetEmployee() employee: Employee
  ) {
    return this.expenseService.createExpense(body, employee.id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly update data expense',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Put(':id')
  public async updateExpense(@Param('id') id: number, @Body() body: CreateUpdateExpenseDto) {
    return this.expenseService.updateExpense(id, body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly delete data expense',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  public async deleteExpense(@Param('id') id: number) {
    return this.expenseService.deleteExpense(id);
  }
}
