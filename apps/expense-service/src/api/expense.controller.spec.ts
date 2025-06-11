import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

describe('ExpenseController', () => {
  let expenseController: ExpenseController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [ExpenseService],
    }).compile();

    expenseController = app.get<ExpenseController>(ExpenseController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(expenseController.getHello()).toBe('Hello World!');
    });
  });
});
