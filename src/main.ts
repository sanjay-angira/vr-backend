import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://vrindavanrasa.com',
      'https://www.vrindavanrasa.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      // transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('backend/api');

  const config = new DocumentBuilder()
    .setTitle('Spiritual Store API')
    .setDescription(
      'API documentation for the spiritual products e-commerce backend',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('backend/api/docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(port);
  console.log(
    `Application is running on: http://localhost:${port}/backend/api`,
  );
  console.log(
    `Swagger docs available at: http://localhost:${port}/backend/api/docs`,
  );
}
bootstrap();
