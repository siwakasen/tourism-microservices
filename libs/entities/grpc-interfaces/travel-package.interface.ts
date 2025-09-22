// travel-package.interface.ts (grpc)
import { Observable } from 'rxjs';

export interface TravelPackageServiceClient {
  getTravelPackage: (body: {
    id: number;
  }) => Observable<{
    packagePrice: number;
    duration: number;
    packageName: string;
  }>;
}
