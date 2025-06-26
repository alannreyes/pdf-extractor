import { 
  Controller, 
  Post, 
  Get, 
  UseInterceptors, 
  UploadedFiles, 
  HttpException, 
  HttpStatus,
  Logger,
  UsePipes
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { FileValidationPipe } from '../../common/validators/file-validation.pipe';
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
  @UsePipes(new FileValidationPipe())
  async processClaimsFiles(
    @UploadedFiles() files: Express.Multer.File[] = []
  ): Promise<ProcessClaimsResponse | ErrorResponse> {
    try {
      this.logger.log(`Recibida request con ${files.length} archivos`);
      
      // Las validaciones de archivos se manejan en FileValidationPipe
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