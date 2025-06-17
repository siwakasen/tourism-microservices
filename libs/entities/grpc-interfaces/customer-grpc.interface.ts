import { Observable } from 'rxjs';

export interface CustomerServiceClient {
    registerCustomer: (body: { email: string; password: string; name: string; phoneNumber: string; countryOrigin: string }) => Observable<{id: number, jwtToken: string}>;
    deleteCustomer: (body: { id: number }) => Observable<{message: string}>;
  }
