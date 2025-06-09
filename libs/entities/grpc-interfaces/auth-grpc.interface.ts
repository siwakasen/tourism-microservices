import { Observable } from 'rxjs';
import { Employee } from '../employees/employee.entity';
import { Customer } from '../customer/customer.entity';

export interface AuthServiceClient {
  getEmployee: (body: { id: string }) => Observable<Employee>;

  getCustomer: (body: { id: number }) => Observable<Customer>;
}
