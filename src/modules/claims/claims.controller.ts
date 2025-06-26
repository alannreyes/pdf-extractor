import { 
  Controller, 
  Post, 
  Get, 
  UseInterceptors, 
  UploadedFiles, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { 
  ProcessClaimsResponse, 
  HealthCheckResponse, 
  ClaimsConfigResponse, 
  ErrorResponse 
} from './dto/process-claims-response.dto';

@Controller()
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(private readonly claimsService: ClaimsService) {}

  @Post('process-claims')
  @UseInterceptors(FilesInterceptor('files', 3))
  async processClaimsFiles(
    @UploadedFiles() files: Express.Multer.File[] = []
  ): Promise<ProcessClaimsResponse | ErrorResponse> {
    try {
      this.logger.log(`Recibida request con ${files.length} archivos`);
      
      // Validar archivos si existen
      if (files.length > 0) {
        for (const file of files) {
          // Validar MIME type
          if (file.mimetype !== 'application/pdf') {
            throw new HttpException(
              `Archivo ${file.originalname} no es un PDF válido`,
              HttpStatus.BAD_REQUEST
            );
          }
          
          // Validar tamaño (10MB)
          const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
          if (file.size > maxSize) {
            throw new HttpException(
              `Archivo ${file.originalname} excede el tamaño máximo permitido`,
              HttpStatus.BAD_REQUEST
            );
          }
        }
      }

      return await this.claimsService.processClaimsFiles(files);
      
    } catch (error) {
      this.logger.error('Error en endpoint process-claims:', error.message);
      
      // Si es error de validación, mantenerlo
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Error de BD o crítico = 500
      throw new HttpException(
        {
          success: false,
          error: 'Database connection failed',
          message: 'Unable to process request'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async getHealthCheck(): Promise<HealthCheckResponse> {
    return await this.claimsService.getHealthCheck();
  }

  @Get('claims/config')
  async getClaimsConfig(): Promise<ClaimsConfigResponse> {
    try {
      return await this.claimsService.getClaimsConfig();
    } catch (error) {
      this.logger.error('Error obteniendo configuración:', error.message);
      throw new HttpException(
        'Error al obtener configuración',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 