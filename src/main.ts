import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvValidation } from './config/env-validation';

async function bootstrap() {
  // Validar variables de entorno al iniciar
  EnvValidation.validate();
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar CORS de forma segura
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] // Cambiar por dominio real en producción
      : true, // Permitir cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configurar prefijo global para API
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT) || 5010; // Puerto por defecto 5010
  await app.listen(port);
  
  console.log(`🚀 Aplicación iniciada en: http://localhost:${port}/api`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`📁 Claims config: http://localhost:${port}/api/claims/config`);
  console.log(`📄 Process claims: POST http://localhost:${port}/api/process-claims`);
}

bootstrap();