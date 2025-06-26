import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { OpenAIService } from './services/openai.service';
import { PdfParserService } from './services/pdf-parser.service';
import { CacheService } from './services/cache.service';
import { ClaimExtract } from './entities/claim-extract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClaimExtract])
  ],
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    OpenAIService,
    PdfParserService,
    CacheService,
  ],
  exports: [ClaimsService],
})
export class ClaimsModule {} 