import { 
  Controller, 
  Post, 
  Get, 
  UseInterceptors, 
  UploadedFile, 
  HttpException, 
  HttpStatus,
  Logger,
  UsePipes
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { FileValidationPipe } from '../../common/validators/file-validation.pipe';
import { 
  ProcessSingleFileResponse, 
  HealthCheckResponse, 
  ClaimsConfigResponse, 
  ErrorResponse 
} from './dto/process-claims-response.dto';

@Controller()
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(private readonly claimsService: ClaimsService) {}

  // ✅ ENDPOINT SIMPLIFICADO: Procesar UN archivo
  @Post('process-claims')
  @UseInterceptors(FileInterceptor('file')) // Cambio: Solo 1 archivo
  @UsePipes(new FileValidationPipe())
  async processSingleClaimFile(
    @UploadedFile() file?: Express.Multer.File
  ): Promise<ProcessSingleFileResponse | ErrorResponse> {
    try {
      // Validar que se envió un archivo
      if (!file) {
        this.logger.warn('No se proporcionó archivo');
        return {
          success: false,
          error: 'No file provided',
          message: 'Debe proporcionar un archivo PDF',
          timestamp: new Date().toISOString()
        };
      }

      this.logger.log(`Recibida request con archivo: ${file.originalname}`);
      
      return await this.claimsService.processSingleFile(file);
      
    } catch (error) {
      this.logger.error('Error en endpoint process-claims:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: 'Database connection failed',
          message: 'Unable to process request',
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck(): Promise<HealthCheckResponse> {
    return await this.claimsService.getHealthCheck();
  }

  @Get('claims/config')
  async getClaimsConfig(): Promise<ClaimsConfigResponse> {
    return await this.claimsService.getClaimsConfig();
  }
} 