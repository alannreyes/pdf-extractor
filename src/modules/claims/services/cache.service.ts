import { Injectable, Logger } from '@nestjs/common';
import { ClaimExtract } from '../entities/claim-extract.entity';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, any>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

  set(key: string, value: any, ttl: number = this.TTL): void {
    const expirationTime = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expirationTime,
    });
    this.logger.log(`Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > item.expirationTime) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return item.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.log(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expirationTime) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cache cleanup: ${cleaned} entries removed`);
    }
  }

  // Obtener estadísticas del cache
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
} 