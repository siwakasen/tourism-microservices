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
  updateStatusDto,
} from './cars.dto';
import { CarsService } from './cars.service';
import { AuthGuard } from '@nestjs/passport';
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
    description: 'Successfuly get data cars by id',
  })
  @Get('/:id')
  public async getCarsById(@Param('id') id: string) {
    return await this.carsService.getCarById(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly create data cars',
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Post('admin')
  public async createCars(@Body() body: CreateUpdateCarsDto) {
    return await this.carsService.createCar(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully uploaded travelpackage thumbnail',
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
  @Post('admin/upload-image/:id')
  @ApiBody({
    type: UploadImageDto,
  })
  public async uploadImage(
    @Param('id') id: string,
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
  @Put('admin/:id')
  public async updateCars(
    @Param('id') id: string,
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
  @Delete('admin/:id')
  public async deleteCars(@Param('id') id: string) {
    return await this.carsService.deleteCar(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully update status data cars',
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Patch('admin/status/:id')
  public async updateStatusCars(
    @Param('id') id: string,
    @Body() body: updateStatusDto,
  ) {
    return await this.carsService.updateCarStatus(id, body);
  }
}
