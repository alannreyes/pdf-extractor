import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ClaimExtract } from '../modules/claims/entities/claim-extract.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'automate_mysql',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'mysql',
  password: process.env.DB_PASSWORD || '27d9IyP3Tyg19WUL8a6T',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'axioma', // Soporte para ambas variables
  entities: [ClaimExtract],
  synchronize: false, // IMPORTANTE: No sincronizar, la tabla ya existe
  logging: process.env.NODE_ENV === 'development',
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 3000,
}); 