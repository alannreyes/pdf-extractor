import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimExtract } from './entities/claim-extract.entity';
import { OpenAIService } from './services/openai.service';
import { PdfParserService } from './services/pdf-parser.service';
import { 
  ProcessClaimsResponse, 
  ProcessClaimsData, 
  HealthCheckResponse, 
  ClaimsConfigResponse 
} from './dto/process-claims-response.dto';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private claimConfigsCache: ClaimExtract[] = null;

  constructor(
    @InjectRepository(ClaimExtract)
    private readonly claimExtractRepository: Repository<ClaimExtract>,
    private readonly openaiService: OpenAIService,
    private readonly pdfParserService: PdfParserService,
  ) {}

  async processClaimsFiles(files: Express.Multer.File[]): Promise<ProcessClaimsResponse> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    this.logger.log(`Iniciando procesamiento de ${files.length} archivos`);

    try {
      // 1. Obtener configuración de BD (con cache)
      const claimConfigs = await this.getClaimConfigs();
      
      // 2. Crear mapa de archivos recibidos
      const filesMap = new Map(files.map(f => [f.originalname, f]));
      this.logger.log(`Archivos recibidos: ${Array.from(filesMap.keys()).join(', ')}`);
      
      // 3. Inicializar resultado con campos vacíos
      const result: ProcessClaimsData = {} as ProcessClaimsData;
      claimConfigs.forEach(config => {
        result[config.fieldname] = "";
      });
      
      // 4. Procesar cada configuración
      let processedCount = 0;
      for (const config of claimConfigs) {
        const file = filesMap.get(config.filename);
        
        if (!file) {
          errors.push(`${config.filename}: File not provided`);
          this.logger.warn(`Archivo faltante: ${config.filename}`);
          continue;
        }
        
        try {
          // Extraer texto del PDF
          const pdfText = await this.pdfParserService.extractText(file.buffer);
          
          // Verificar que se extrajo texto
          if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('No se pudo extraer texto del PDF');
          }
          
          // Llamar a OpenAI con reintentos
          const summary = await this.callOpenAIWithRetries(config.prompt, pdfText);
          
          // Asignar resultado
          result[config.fieldname] = summary;
          processedCount++;
          
          this.logger.log(`Procesado exitosamente: ${config.filename} -> ${config.fieldname}`);
        } catch (error) {
          const errorMsg = `${config.filename}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
          // Campo ya está inicializado como ""
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      this.logger.log(`Procesamiento completado en ${processingTime}ms. Archivos procesados: ${processedCount}/${claimConfigs.length}`);
      
      return {
        success: true,
        data: result,
        metadata: {
          processed_files: processedCount,
          total_expected: claimConfigs.length,
          processing_time_ms: processingTime,
          errors: errors.length > 0 ? errors : undefined
        }
      };
      
    } catch (error) {
      this.logger.error('Error crítico en procesamiento:', error.message);
      throw error; // Esto resultará en Error 500
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
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  private async getClaimConfigs(): Promise<ClaimExtract[]> {
    if (!this.claimConfigsCache) {
      this.logger.log('Cargando configuraciones de la base de datos');
      this.claimConfigsCache = await this.claimExtractRepository.find();
      this.logger.log(`Configuraciones cargadas: ${this.claimConfigsCache.length}`);
    }
    return this.claimConfigsCache;
  }

  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      // Verificar conexión a BD
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