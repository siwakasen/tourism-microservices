// car-grpc.interface.ts (grpc)
import { Observable } from 'rxjs';

export interface CarServiceClient {
  getCar: (body: {
    id: number;
  }) => Observable<{ pricePerDay: number; carName: string }>;
}
