import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from './api.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { FormatErrorInterceptor } from 'libs/helper/interceptors/exeption.interceptor';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');
  const gRPCPort: number = config.get<number>('CAR_GRPC_PORT');
  app.set('trust proxy', 1);
  console.log('Running on', config.get<string>('NODE_ENV'));

  if (config.get<string>('NODE_ENV') === 'development') {
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'application/json'],
      maxAge: 600,
    });
  } else {
    app.enableCors({
      origin: [
        'https://travel.vulpbox.com',
        'https://admin.vulpbox.com',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'application/json'],
      maxAge: 600,
    });
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  //   app.useGlobalInterceptors(new FormatErrorInterceptor());

  const configSwagger = new DocumentBuilder()
    .setTitle('Rent Car Service')
    .setDescription('API for Rent Car')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .addServer(`https://rent-car-service.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api-docs', app, document);

  // GRPC
  const appGRPC = await NestFactory.createMicroservice<MicroserviceOptions>(
    ApiModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${gRPCPort}`,
        package: 'car',
        protoPath: 'contract/rent-car-api.proto',
        loader: {
          keepCase: true,
        },
      },
    },
  );
  await app.listen(port, () => {
    console.log('[Rent Car Service]', `http://localhost:${port}`);
  });

  await appGRPC.listen();
  console.log('[GRPC Rent Car Service]', `gRPC: 0.0.0.0:${gRPCPort}`);
}

bootstrap();
