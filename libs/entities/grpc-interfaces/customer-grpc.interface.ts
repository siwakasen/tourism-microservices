import { Observable } from 'rxjs';

export interface CustomerServiceClient {
  registerCustomer: (body: { email: string; password: string; name: string; phoneNumber: string; countryOrigin: string }) => Observable<{id: number}>;
}
