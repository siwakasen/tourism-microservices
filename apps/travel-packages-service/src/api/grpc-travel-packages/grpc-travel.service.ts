import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TravelPackages } from "libs/entities";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class GrpcTravelPackagesService {
  constructor( 
    @InjectRepository(TravelPackages)
    private readonly repository: Repository<TravelPackages>
  ) {}

  public async getTravelPackage(id: number) {
    try {
      const travelPackage: TravelPackages = await this.repository.findOneBy({ id });

      if (!travelPackage) {
        throw new Error('Travel Package not found');
      }

      return {
        packagePrice: travelPackage.package_price,
        duration: travelPackage.duration,
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}