import { Controller, Inject } from "@nestjs/common";
import { GrpcTravelPackagesService } from "./grpc-travel.service";
import { GrpcMethod } from "@nestjs/microservices";

@Controller('grpc-travel-packages')
export class GrpcTravelPackagesController {
  @Inject(GrpcTravelPackagesService)
  private readonly grpcTravelPackagesService: GrpcTravelPackagesService;

  @GrpcMethod('TravelPackageGrpcService', 'GetTravelPackage')
  async getTravelPackage(data: { id: number }) {
    const packagePrice = await this.grpcTravelPackagesService.getTravelPackage(data.id);
    return packagePrice;
  }
}