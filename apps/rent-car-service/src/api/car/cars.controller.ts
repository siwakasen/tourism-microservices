  import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Put,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import {
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import {
  PaginationDto,
  CreateUpdateCarsDto,
  UploadImageDto,
  AvailableCarsDto,
} from './cars.dto';
import { CarsService } from './cars.service';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';
  
@ApiBearerAuth()
@ApiTags('Cars')
@Controller('/cars')
export class CarsController {
  @Inject(CarsService)
  private readonly carsService: CarsService;

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data cars',
  })
  @Get('')
  public async getAllCars(@Query() query: PaginationDto) {
    return await this.carsService.getAllCars(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data cars with deleted',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN, UserType.OWNER)
  @Get('/history')
  public async getAllCarsHistory(@Query() query: PaginationDto) {
    return await this.carsService.getAllCarsWithDeleted(query);
  }

  @Get('available')
  public async getAvailableCars( @Query() query: AvailableCarsDto) {
    return await this.carsService.getAvailableCars( query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data cars by id',
  })
  @Get('/:id')
  public async getCarsById(@Param('id') id: number) {
    return await this.carsService.getCarById(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data cars by id with deleted',
  })
  @Get('/:id/history')
  public async getCarHistoryById(@Param('id') id: number) {
    return await this.carsService.getCarHistoryById(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly create data cars',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post('')
  public async createCars(@Body() body: CreateUpdateCarsDto) {
    return await this.carsService.createCar(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully uploaded car image',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './dist/apps/rent-car-service/public/car-images',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new HttpException(
              {
                message: ['Invalid file type. Only images are allowed.'],
                error: 'Not Acceptable',
                statusCode: HttpStatus.NOT_ACCEPTABLE,
              },
              HttpStatus.NOT_ACCEPTABLE,
            ),
            false,
          );
        }
        cb(null, true); // Accept the file if valid
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post('upload-image/:id')
  @ApiBody({
    type: UploadImageDto,
  })
  public async uploadImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return {
        message: 'Please upload an image',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    return await this.carsService.uploadImage(id, file);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully update data cars',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Put(':id')
  public async updateCars(
    @Param('id') id: number,
    @Body() body: CreateUpdateCarsDto,
  ) {
    return await this.carsService.updateCar(id, body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully delete data cars',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  public async deleteCars(@Param('id') id: number) {
    return await this.carsService.deleteCar(id);
  }

}
