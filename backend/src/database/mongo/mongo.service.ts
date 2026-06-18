import { Inject, Injectable } from '@nestjs/common';
import { Db, GridFSBucket } from 'mongodb';
import { MONGO_DB } from './mongo.constants';

/**
 * Acesso ao MongoDB, dedicado ao armazenamento de mídias pesadas (imagens de
 * medicamentos e bulas em PDF) via GridFS. Os ObjectIds gerados são referenciados
 * de volta no PostgreSQL (medicamentos.imagens / medicamentos.bula_id).
 */
@Injectable()
export class MongoService {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  /** Bucket GridFS para imagens de medicamentos. */
  imagensBucket(): GridFSBucket {
    return new GridFSBucket(this.db, { bucketName: 'imagens' });
  }

  /** Bucket GridFS para bulas (PDFs). */
  bulasBucket(): GridFSBucket {
    return new GridFSBucket(this.db, { bucketName: 'bulas' });
  }

  get database(): Db {
    return this.db;
  }
}
