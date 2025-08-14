import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');
  const gRPCPort: number = config.get<number>('TRANSACTION_GRPC_PORT');
  app.set('trust proxy', 1);
  app.enableCors({
    origin: [
      'https://travel.vulpbox.com',
      'https://admin.vulpbox.com',
      'api.sandbox.midtrans.com',
      'app.sandbox.midtrans.com',
      'api.sandbox.veritrans.co.id',
      'simulator.sandbox.midtrans.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'application/json'],
    maxAge: 600,
  });

  const appGRPC = await NestFactory.createMicroservice<MicroserviceOptions>(
    ApiModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${gRPCPort}`,
        package: 'bookings',
        protoPath: 'contract/bookings-api.proto',
        loader: {
          keepCase: true,
        },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configSwagger = new DocumentBuilder()
    .setTitle('Transaction Service')
    .setDescription('API for Transaction')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`https://transaction-service.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(port, () => {
    console.log(`[Transaction Service] http://localhost:${port}`);
  });

  await appGRPC.listen();
  console.log('[GRPC Bookings Service]', `gRPC: 0.0.0.0:${gRPCPort}`);
}

bootstrap();
