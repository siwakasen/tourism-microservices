import { Controller, Get } from '@nestjs/common';
import { ExpenseService } from './expense.service';

@Controller()
export class ExpenseController {
  constructor(private readonly expenseServiceService: ExpenseService) {}

  @Get()
  getHello(): string {
    return this.expenseServiceService.getHello();
  }
}
