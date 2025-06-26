import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimExtract } from './entities/claim-extract.entity';
import { OpenAIService } from './services/openai.service';
import { PdfParserService } from './services/pdf-parser.service';
import { CacheService } from './services/cache.service';
import { 
  ProcessClaimsResponse, 
  ConsolidatedSummaries,
  ProcessingStats,
  HealthCheckResponse, 
  ClaimsConfigResponse 
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
  ) {
    // Iniciar limpieza periódica del cache
    setInterval(() => {
      this.cacheService.cleanup();
    }, 60000); // Cada minuto
  }

  async processClaimsFiles(files: Express.Multer.File[]): Promise<ProcessClaimsResponse> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    this.logger.log(`🚀 Iniciando procesamiento consolidado de ${files.length} archivos`);

    try {
      // 1. Obtener configuración de BD (con cache)
      const claimConfigs = await this.getClaimConfigs();
      
      // 2. Crear mapa de archivos recibidos
      const filesMap = new Map(files.map(f => [f.originalname, f]));
      this.logger.log(`📁 Archivos recibidos: ${Array.from(filesMap.keys()).join(', ')}`);
      
      // 3. Inicializar summaries consolidados
      const summaries: ConsolidatedSummaries = {
        claim_acknowledgment: "",
        coverage_determination: "",
        demand_letter: ""
      };
      
      // 4. Mapeo de archivos a campos consolidados
      const fileToFieldMap = {
        'CLAIM_ACK_LETTER.pdf': 'claim_acknowledgment',
        'COVERAGE_DETERMINATION.pdf': 'coverage_determination', 
        'DEMAND_LETTER.pdf': 'demand_letter'
      };
      
      // 5. Identificar archivos presentes vs faltantes
      const presentFiles = claimConfigs.filter(config => filesMap.has(config.filename));
      const missingFiles = claimConfigs.filter(config => !filesMap.has(config.filename));
      
      if (missingFiles.length > 0) {
        this.logger.log(`📄 Archivos omitidos (no proporcionados): ${missingFiles.map(c => c.filename).join(', ')}`);
      }
      
      if (presentFiles.length > 0) {
        this.logger.log(`🔄 Procesando archivos: ${presentFiles.map(c => c.filename).join(', ')}`);
      }
      
      // 6. Procesar archivos en paralelo (SOLO los que están presentes)
      const processingPromises = presentFiles.map(async (config) => {
          const file = filesMap.get(config.filename);
          const consolidatedField = fileToFieldMap[config.filename];
          
          // Ya sabemos que el archivo existe por el filter anterior
        
        const fileStartTime = Date.now();
        
        try {
          // Extraer texto del PDF
          const pdfText = await this.pdfParserService.extractText(file.buffer);
          
          // Verificar que se extrajo texto
          if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('No se pudo extraer texto del PDF');
          }
          
          // Llamar a OpenAI con reintentos
          const summary = await this.callOpenAIWithRetries(config.prompt, pdfText);
          
          const fileProcessingTime = Date.now() - fileStartTime;
          
          this.logger.log(`✅ Procesado exitosamente: ${config.filename} (${fileProcessingTime}ms)`);
          return { 
            filename: config.filename,
            fieldname: consolidatedField, 
            result: summary, 
            success: true,
            processingTime: fileProcessingTime
          };
        } catch (error) {
          const errorMsg = `❌ ${config.filename}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
          return { 
            filename: config.filename,
            fieldname: consolidatedField, 
            result: "", 
            success: false,
            processingTime: Date.now() - fileStartTime
          };
        }
      });

      // Esperar a que todos los procesamientos terminen
      const results = await Promise.allSettled(processingPromises);
      let successfulExtractions = 0;
      let totalFileTime = 0;

      // Procesar resultados y consolidar
      results.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const { fieldname, result: summary, success, processingTime } = promiseResult.value;
          
          if (fieldname && summaries.hasOwnProperty(fieldname)) {
            summaries[fieldname] = summary;
          }
          
          if (success) {
            successfulExtractions++;
          }
          
          totalFileTime += processingTime;
        } else {
          // Error en la promesa misma - USAR presentFiles[index] en lugar de claimConfigs[index]
          const config = presentFiles[index]; // ✅ CORREGIDO: Usar el índice correcto
          this.logger.error(`💥 Error crítico procesando ${config.filename}:`, promiseResult.reason);
          errors.push(`💥 ${config.filename}: Error crítico en procesamiento`);
        }
      });
      
      const totalProcessingTime = Date.now() - startTime;
      const averageTimePerFile = claimConfigs.length > 0 ? Math.round(totalFileTime / claimConfigs.length) : 0;
      
      // Estadísticas consolidadas (solo archivos procesados)
      const filesProcessed = results.length; // Solo los archivos que se intentaron procesar
      const processingStats: ProcessingStats = {
        files_processed: filesProcessed,
        total_time_ms: totalProcessingTime,
        average_time_per_file: filesProcessed > 0 ? Math.round(totalFileTime / filesProcessed) : 0,
        successful_extractions: successfulExtractions,
        failed_extractions: filesProcessed - successfulExtractions
      };
      
      this.logger.log(`🎉 Procesamiento consolidado completado en ${totalProcessingTime}ms. Éxitos: ${successfulExtractions}/${filesProcessed}`);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        summaries,
        processing_stats: processingStats,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      this.logger.error('💥 Error crítico en procesamiento:', error.message);
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
    // Intentar obtener del cache primero
    let configs = this.cacheService.get<ClaimExtract[]>(ClaimsService.CACHE_KEY_CONFIGS);
    
    if (!configs) {
      this.logger.log('Cargando configuraciones de la base de datos');
      configs = await this.claimExtractRepository.find();
      this.logger.log(`Configuraciones cargadas: ${configs.length}`);
      
      // Guardar en cache por 5 minutos
      this.cacheService.set(ClaimsService.CACHE_KEY_CONFIGS, configs, 5 * 60 * 1000);
    }
    
    return configs;
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