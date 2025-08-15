import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from './api.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');
  const gRPCPort: number = config.get<number>('TRAVEL_PACKAGE_GRPC_PORT');
  console.log('Running on', config.get<string>('NODE_ENV'));
  app.set('trust proxy', 1);
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

  // GRPC
  const appGRPC = await NestFactory.createMicroservice<MicroserviceOptions>(
    ApiModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${gRPCPort}`,
        package: 'travelpackage',
        protoPath: 'contract/travel-package-api.proto',
      },
    },
  );

  const configSwagger = new DocumentBuilder()
    .setTitle('Travel Package Service')
    .setDescription('API for Travel Package')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .addServer(`https://travel-packages-service.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port, () => {
    console.log('[Travel Package Service]', `http://localhost:${port}`);
  });

  await appGRPC.listen();
  console.log('[GRPC Travel Package Service]', `gRPC: 0.0.0.0:${gRPCPort}`);
}

bootstrap();
