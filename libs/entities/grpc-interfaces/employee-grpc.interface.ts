import { Observable } from 'rxjs';
import { Employee } from '../employees/employee.entity';
import { Customer } from '../customer/customer.entity';

export interface EmployeeServiceClient {
  getEmployee: (body: { id: number }) => Observable<Employee>;
}
