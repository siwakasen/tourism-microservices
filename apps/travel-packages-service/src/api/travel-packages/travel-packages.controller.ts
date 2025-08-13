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
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { TravelPackagesService } from './travel-packages.service';
import {
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  PaginationDto,
  CreateUpdateTravelPackageDto,
  UploadImagesDto,
  DeleteImagesDto,
  UploadThumbnailDto,
} from './travel-packages.dto';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { Roles, UserType } from '@app/helpers/auth/decorators/auth.decorator';

@ApiBearerAuth()
@ApiTags('Travel Packages')
@Controller('/travel-packages')
export class TravelPackagesController {
  @Inject(TravelPackagesService)
  private readonly travelPackagesService: TravelPackagesService;
  @ApiResponse({
    status: 200,
    description: 'Successfuly get data travel package',
  })
  @Get('')
  public async getTravelPackages(@Query() query: PaginationDto) {
    return await this.travelPackagesService.getAllTravelPackages(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data travel package with deleted',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN, UserType.OWNER)
  @Get('/history')
  public async getTravelPackagesHistory(@Query() query: PaginationDto) {
    return await this.travelPackagesService.getAllTravelPackagesWithDeleted(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data travel package by id',
  })
  @Get('/:id')
  public async getTravelPackageById(@Param('id') id: number) {
    return await this.travelPackagesService.getTravelPackageById(id);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly get data travel package by id with deleted',
  })
  @Get('/:id/history')
  public async getTravelPackageHistoryById(@Param('id') id: number) {
    return await this.travelPackagesService.getTravelPackageHistoryById(id);
  }

  @ApiResponse({
    status: 201,
    description: 'Successfuly create data travel package',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post('')
  public async createTravelPackage(@Body() body: CreateUpdateTravelPackageDto) {
    return await this.travelPackagesService.createTravelPackage(body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully uploaded travel package images',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './dist/apps/travel-packages-service/public/travel-images',
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
    return await this.travelPackagesService.uploadImages(id, files);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully updated travel package thumbnail',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('thumbnail', 1, {
    storage: diskStorage({
      destination: './dist/apps/travel-packages-service/public/travel-images',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
      }
      cb(null, true);
    },
  }))
  @ApiBody({
    type: UploadThumbnailDto,
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Post('upload-thumbnail/:id')
  public async uploadThumbnail(
    @Param('id') id: number,
    @UploadedFiles() file: Express.Multer.File,
  ) {
    if (!file) {
      return {
        message: 'Please upload a thumbnail image',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
    return await this.travelPackagesService.updateThumbnail(id, file);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully deleted travel package images',
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
    return await this.travelPackagesService.deleteImage(id, body.imagePath);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly update data travel package',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Put('/:id')
  public async updateTourPackage(
    @Param('id') id: number,
    @Body() body: CreateUpdateTravelPackageDto,
  ) {
    return await this.travelPackagesService.updateTravelPackage(id, body);
  }

  @ApiResponse({
    status: 200,
    description: 'Successfuly delete data travel package',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  @Delete('/:id')
  public async deleteTravelPackage(@Param('id') id: number) {
    return await this.travelPackagesService.deleteTravelPackage(id);
  }

}
