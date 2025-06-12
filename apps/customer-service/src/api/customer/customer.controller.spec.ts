import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  let customerController: CustomerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [CustomerService],
    }).compile();

    customerController = app.get<CustomerController>(CustomerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(customerController.getHello()).toBe('Hello World!');
    });
  });
});
