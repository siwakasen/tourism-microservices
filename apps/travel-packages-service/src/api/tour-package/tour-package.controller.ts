import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Put,
  Param,
  HttpException,
  HttpStatus,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { TourPackageService } from './tour-package.service';
import {
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  PaginationDto,
  CreateUpdateTourPackageDto,
  UploadImagesDto,
  updateStatusDto,
  DeleteImagesDto,
} from './tour-package.dto';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';

@ApiBearerAuth()
@ApiTags('Tour Package')
@Controller('/tour-package')
export class TourPackageController {
  @Inject(TourPackageService)
  private readonly tourApiService: TourPackageService;
  @ApiResponse({
    status: 200,
    description: 'Successfuly get data tour package',
  })
  @Get('')
  public async getTourPackage(@Query() query: PaginationDto) {
    return await this.tourApiService.getAllTourPackage(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data tour package by id',
  })
  @Get('/:id')
  public async getTourPackageById(@Param('id') id: number) {
    return await this.tourApiService.getTourPackageById(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly create data tour package',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post('')
  public async createTourPackage(@Body() body: CreateUpdateTourPackageDto) {
    return await this.tourApiService.createTourPackage(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully uploaded tour package images',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './dist/apps/tour-package-service/public/tour-images',
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
  @Post('upload-images/:id')
  @ApiBody({
    type: UploadImagesDto,
  })
  public async uploadFiles(
    @Param('id') id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (files.length < 1) {
      return {
        message: 'Please upload at least one image',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    return await this.tourApiService.uploadImages(id, files);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully deleted tour package images',
  })
  @ApiBody({
    type: DeleteImagesDto,
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Delete('delete-images/:id')
  public async deleteImage(
    @Param('id') id: number,
    @Body() body: DeleteImagesDto,
  ) {
    return await this.tourApiService.deleteImage(id, body.imagePath);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly update data tour package',
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Put('/:id')
  public async updateTourPackage(
    @Param('id') id: number,
    @Body() body: CreateUpdateTourPackageDto,
  ) {
    return await this.tourApiService.updateTourPackage(id, body);
  }
  @ApiResponse({
    status: 200,
    description: 'Successfuly update data tour package status',
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Patch('/status/:id')
  public async updateTourPackageStatus(
    @Param('id') id: number,
    @Body() body: updateStatusDto,
  ) {
    return await this.tourApiService.updateTourPackageStatus(id, body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly delete data tour package',
  })
  @UseGuards(JwtAuthGuard)
 @Roles(UserType.ADMIN)
  @Delete('/:id')
  public async deleteTourPackage(@Param('id') id: number) {
    return await this.tourApiService.deleteTourPackage(id);
  }
}
