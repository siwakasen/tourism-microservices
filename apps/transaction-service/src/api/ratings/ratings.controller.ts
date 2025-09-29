import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { GetCustomer } from '@app/helpers/auth/decorators/get-user.decorator';
import { CreateRatingDto, PaginationDto } from './ratings.dto';
import { Customer } from 'libs/entities';

@ApiTags('Ratings Controller')
@ApiBearerAuth()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.CUSTOMER)
  @ApiBearerAuth()
  async createRating(
    @Body() body: CreateRatingDto,
    @GetCustomer() customer: Customer
  ) {
    return this.ratingsService.createRating(body, customer.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.OWNER)
  @ApiBearerAuth()
  async getRatings(@Query() query: PaginationDto) {
    return this.ratingsService.getRatings(query);
  }

  @Get('car/:car_id')
  @ApiBearerAuth()
  async getRatingByCarId(@Param('car_id') car_id: number) {
    return this.ratingsService.getRatingByCarId(car_id);
  }

  @Get('package/:package_id')
  @ApiBearerAuth()
  async getRatingByPackageId(@Param('package_id') package_id: number) {
    return this.ratingsService.getRatingByPackageId(package_id);
  }

  @Get('reviews')
  @ApiBearerAuth()
  async getRatingReviews() {
    return this.ratingsService.getRatingReviews();
  }
}
