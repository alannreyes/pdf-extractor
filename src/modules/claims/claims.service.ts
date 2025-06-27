import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimExtract } from './entities/claim-extract.entity';
import { OpenAIService } from './services/openai.service';
import { PdfParserService } from './services/pdf-parser.service';
import { CacheService } from './services/cache.service';
import { 
  ProcessSingleFileResponse, 
  HealthCheckResponse, 
  ClaimsConfigResponse, 
  ErrorResponse 
} from './dto/process-claims-response.dto';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private static readonly CACHE_KEY_CONFIGS = 'claim_configs';

  constructor(
    @InjectRepository(ClaimExtract)
    private readonly claimExtractRepository: Repository<ClaimExtract>,
    private readonly openaiService: OpenAIService,
    private readonly pdfParserService: PdfParserService,
    private readonly cacheService: CacheService,
  ) {}

  // ✅ MÉTODO SIMPLIFICADO: Procesar UN solo archivo
  async processSingleFile(file: Express.Multer.File): Promise<ProcessSingleFileResponse> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    this.logger.log(`🚀 Procesando archivo individual: ${file.originalname}`);

    try {
      // 1. Obtener configuración de BD
      const claimConfigs = await this.getClaimConfigs();
      
      // 2. Buscar configuración para este archivo específico
      const config = claimConfigs.find(c => c.filename === file.originalname);
      
      if (!config) {
        const processingTime = Date.now() - startTime;
        this.logger.warn(`❌ Archivo no configurado: ${file.originalname}`);
        
        return {
          success: false,
          timestamp,
          filename: file.originalname,
          fieldname: '',
          summary: '',
          processing_time_ms: processingTime,
          error: `Archivo ${file.originalname} no está configurado en la base de datos`
        };
      }

      // 3. Procesar el archivo
      try {
        // Extraer texto del PDF
        const pdfText = await this.pdfParserService.extractText(file.buffer);
        
        if (!pdfText || pdfText.trim().length === 0) {
          throw new Error('No se pudo extraer texto del PDF');
        }
        
        // Llamar a OpenAI con reintentos
        const summary = await this.callOpenAIWithRetries(config.prompt, pdfText);
        
        const processingTime = Date.now() - startTime;
        
        this.logger.log(`✅ Procesado exitosamente: ${file.originalname} (${processingTime}ms)`);
        
        return {
          success: true,
          timestamp,
          filename: file.originalname,
          fieldname: config.fieldname,
          summary,
          processing_time_ms: processingTime
        };
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMsg = `Error procesando ${file.originalname}: ${error.message}`;
        
        this.logger.error(`❌ ${errorMsg}`);
        
        return {
          success: false,
          timestamp,
          filename: file.originalname,
          fieldname: config.fieldname,
          summary: '',
          processing_time_ms: processingTime,
          error: error.message
        };
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('💥 Error crítico en procesamiento:', error.message);
      
      return {
        success: false,
        timestamp,
        filename: file.originalname,
        fieldname: '',
        summary: '',
        processing_time_ms: processingTime,
        error: 'Error crítico del sistema'
      };
    }
  }

  private async callOpenAIWithRetries(prompt: string, documentText: string): Promise<string> {
    const maxRetries = 2;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this.openaiService.processDocument(prompt, documentText);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Intento ${attempt} falló para OpenAI: ${error.message}`);
        
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  private async getClaimConfigs(): Promise<ClaimExtract[]> {
    let configs = this.cacheService.get<ClaimExtract[]>(ClaimsService.CACHE_KEY_CONFIGS);
    
    if (!configs) {
      this.logger.log('Cargando configuraciones de la base de datos');
      configs = await this.claimExtractRepository.find();
      this.logger.log(`Configuraciones cargadas: ${configs.length}`);
      
      this.cacheService.set(ClaimsService.CACHE_KEY_CONFIGS, configs, 5 * 60 * 1000);
    }
    
    return configs;
  }

  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      await this.claimExtractRepository.count();
      
      return {
        status: 'ok',
        db: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check falló:', error.message);
      return {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getClaimsConfig(): Promise<ClaimsConfigResponse> {
    const claimConfigs = await this.getClaimConfigs();
    
    return {
      expected_files: claimConfigs.map(config => config.filename),
      fields: claimConfigs.map(config => config.fieldname)
    };
  }
} 