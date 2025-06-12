import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let expenseController: ExpensesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [ExpensesService],
    }).compile();

    expenseController = app.get<ExpensesController>(ExpensesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(expenseController.getHello()).toBe('Hello World!');
    });
  });
});
