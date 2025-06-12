import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');
  const gRPCPort: number = config.get<number>('CUS_AUTH_GRPC_PORT');
  app.set('trust proxy', 1);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://client-web-app.vulpbox.com',
      'https://admin-web-app.vulpbox.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // GRPC
  const appGRPC = await NestFactory.createMicroservice<MicroserviceOptions>(
    ApiModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${gRPCPort}`,
        package: 'auth',
        protoPath: 'contract/auth-customer-api.proto',
      },
    },
  );

  const configSwagger = new DocumentBuilder()
    .setTitle('Customer API Service')
    .setDescription('API for Customer data CRUD')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .addServer(`https://customers.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api-docs', app, document);
  
  await app.listen(port, () => {
    console.log('[Customer Service]', `http://localhost:${port}`);
  });

  await appGRPC.listen();
}
bootstrap();
