import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar CORS si es necesario
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configurar prefijo global para API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Aplicación iniciada en: http://localhost:${port}/api`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`📁 Claims config: http://localhost:${port}/api/claims/config`);
  console.log(`📄 Process claims: POST http://localhost:${port}/api/process-claims`);
}

bootstrap();