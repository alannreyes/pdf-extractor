import { Injectable, Logger } from '@nestjs/common';
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  async extractText(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('Iniciando extracción de texto del PDF');
      
      const data = await pdfParse(buffer);
      const extractedText = data.text.trim();
      
      this.logger.log(`Texto extraído: ${extractedText.length} caracteres`);
      
      // Limpiar el buffer de memoria
      buffer = null;
      
      return extractedText;
    } catch (error) {
      this.logger.error('Error extrayendo texto del PDF:', error.message);
      
      // Limpiar el buffer incluso en caso de error
      buffer = null;
      
      throw new Error(`Error al procesar PDF: ${error.message}`);
    }
  }
} 