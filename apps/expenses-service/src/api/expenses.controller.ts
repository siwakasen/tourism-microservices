import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateUpdateExpensesDto, PaginationDto } from './expenses.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { GetEmployee } from '@app/helpers/auth/decorators/get-user.decorator';
import { Employee } from 'libs/entities/employees';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  @Inject(ExpensesService)
  private readonly expenseService: ExpensesService;

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data expenses',
  })
  @Get()
  public async getAllExpensess(@Query() query: PaginationDto) {
    console.log(query);
    return this.expenseService.getAllExpensess(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data expenses by id',
  })
  @Get(':id')
  public async getExpensesById(@Param('id') id: number) {
    return this.expenseService.getExpensesById(id);
  }


  @ApiResponse({
    status: 200,
    description: 'Successfuly create data expenses',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post()
  public async createExpenses(
    @Body() body: CreateUpdateExpensesDto,
    @GetEmployee() employee: Employee
  ) {
    return this.expenseService.createExpenses(body, employee.id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly update data expenses',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Put(':id')
  public async updateExpenses(@Param('id') id: number, @Body() body: CreateUpdateExpensesDto) {
    return this.expenseService.updateExpenses(id, body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly delete data expenses',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  public async deleteExpenses(@Param('id') id: number) {
    return this.expenseService.deleteExpenses(id);
  }
}
