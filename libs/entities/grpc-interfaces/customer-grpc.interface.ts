// customer-grpc.interface.ts (grpc)
import { Observable } from 'rxjs';
import { Customer } from '../customer/customer.entity';

export interface CustomerServiceClient {
  getCustomer: (body: { id: number }) => Observable<Customer>;
  registerCustomer: (body: {
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
    countryOrigin: string;
  }) => Observable<{ id: number; jwtToken: string }>;
  deleteCustomer: (body: { id: number }) => Observable<{ message: string }>;
}
