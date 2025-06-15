import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');

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

  const configSwagger = new DocumentBuilder()
    .setTitle('Transaction Service')
    .setDescription('API for Transaction')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .addServer(`https://transaction-service.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(port, () => {
    console.log(`Transaction service is running on port ${port}`);
  });
}

bootstrap();
