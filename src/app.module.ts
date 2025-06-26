import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ClaimsModule } from './modules/claims/claims.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configuración de base de datos MySQL
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    
    // Configuración global de Multer para archivos
    MulterModule.register({
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // Validar que solo se procesen PDFs
        if (file.mimetype === 'application/pdf') {
          callback(null, true);
        } else {
          callback(new Error('Solo se permiten archivos PDF'), false);
        }
      },
    }),
    
    // Módulo principal de claims
    ClaimsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 