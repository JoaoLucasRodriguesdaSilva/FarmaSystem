import { Module } from '@nestjs/common';
import { ArquivosService } from './arquivos.service';

/**
 * Módulo de mídia: expõe apenas o ArquivosService (sem Controller público).
 * O MongoModule é global, então o MongoService já está disponível para injeção.
 */
@Module({
  providers: [ArquivosService],
  exports: [ArquivosService],
})
export class ArquivosModule {}
