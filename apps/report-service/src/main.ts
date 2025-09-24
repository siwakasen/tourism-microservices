import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(ApiModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');
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
      origin: ['https://travel.vulpbox.com', 'https://admin.vulpbox.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'application/json'],
      maxAge: 600,
    });
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const configSwagger = new DocumentBuilder()
    .setTitle('Report Service')
    .setDescription('API for Report')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .addServer(`https://report-service.vulpbox.com`)
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  if (config.get<string>('NODE_ENV') === 'development') {
    SwaggerModule.setup('api-docs', app, document);
  }
  await app.listen(port, () => {
    console.log('[Report Service]', `http://localhost:${port}`);
  });
}
bootstrap();
