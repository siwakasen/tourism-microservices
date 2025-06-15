import { Controller, Inject } from "@nestjs/common";
import { GrpcCarService } from "./grpc-car.service";
import { GrpcMethod } from "@nestjs/microservices";

@Controller('grpc-car')
export class GrpcCarController {
  @Inject(GrpcCarService)
  private readonly grpcCarService: GrpcCarService;

  @GrpcMethod('CarGrpcService', 'GetCar')
  async getCar(data: { id: number }) {
    const car = await this.grpcCarService.getCar(data.id);
    return car;
  }
}