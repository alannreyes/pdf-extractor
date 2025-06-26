import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { openaiConfig } from '../../../config/openai.config';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      timeout: openaiConfig.timeout,
      maxRetries: openaiConfig.maxRetries,
    });
  }

  async processDocument(prompt: string, documentText: string): Promise<string> {
    try {
      this.logger.log('Iniciando procesamiento con OpenAI');
      
      const response = await this.openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a legal document analyzer. Follow the format instructions exactly.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nDocument content:\n${documentText}`,
          },
        ],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      this.logger.log(`Procesamiento completado. Resultado: ${result.length} caracteres`);
      
      return result;
    } catch (error) {
      this.logger.error('Error en OpenAI:', error.message);
      throw error;
    }
  }
} 