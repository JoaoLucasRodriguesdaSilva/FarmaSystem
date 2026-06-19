import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GridFSBucket, GridFSFile, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { MongoService } from '../../database/mongo/mongo.service';

export interface ArquivoStream {
  stream: Readable;
  contentType: string;
  filename: string;
  length: number;
}

/**
 * Serviço interno (sem Controller público) para persistir e resgatar mídias no
 * MongoDB via GridFS. Os ObjectIds gerados são referenciados de volta no
 * PostgreSQL (medicamentos.imagens / medicamentos.bula_id). O acesso externo às
 * mídias é mediado pelo módulo de Medicamentos.
 */
@Injectable()
export class ArquivosService {
  constructor(private readonly mongo: MongoService) {}

  /** Sobe uma imagem ao bucket de imagens e devolve o ObjectId (string). */
  async uploadImagem(
    file: Express.Multer.File,
    medicamentoId?: number,
  ): Promise<string> {
    return this.upload(this.mongo.imagensBucket(), file, {
      tipo: 'imagem_medicamento',
      medicamento_id: medicamentoId,
    });
  }

  /** Sobe um PDF (bula) ao bucket de bulas e devolve o ObjectId (string). */
  async uploadPdf(
    file: Express.Multer.File,
    medicamentoId?: number,
  ): Promise<string> {
    return this.upload(this.mongo.bulasBucket(), file, {
      tipo: 'bula_medicamento',
      medicamento_id: medicamentoId,
    });
  }

  /** Stream + metadados de uma imagem por ObjectId. */
  getImagemStream(id: string): Promise<ArquivoStream> {
    return this.getStream(this.mongo.imagensBucket(), id);
  }

  /** Stream + metadados de uma bula (PDF) por ObjectId. */
  getBulaStream(id: string): Promise<ArquivoStream> {
    return this.getStream(this.mongo.bulasBucket(), id);
  }

  async deleteImagem(id: string): Promise<void> {
    await this.tryDelete(this.mongo.imagensBucket(), id);
  }

  async deleteBula(id: string): Promise<void> {
    await this.tryDelete(this.mongo.bulasBucket(), id);
  }

  private upload(
    bucket: GridFSBucket,
    file: Express.Multer.File,
    metadata: Record<string, unknown>,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata,
      });
      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', (err) =>
          reject(
            new InternalServerErrorException({
              codigo: 'FALHA_UPLOAD_ARQUIVO',
              message: `Falha ao salvar o arquivo: ${err.message}`,
            }),
          ),
        )
        .on('finish', () => resolve(uploadStream.id.toString()));
    });
  }

  private async getStream(
    bucket: GridFSBucket,
    id: string,
  ): Promise<ArquivoStream> {
    const objectId = this.toObjectId(id);
    const file = (await bucket
      .find({ _id: objectId })
      .limit(1)
      .next()) as GridFSFile | null;

    if (!file) {
      throw new NotFoundException({
        codigo: 'ARQUIVO_NAO_ENCONTRADO',
        message: 'Arquivo não encontrado.',
      });
    }

    return {
      stream: bucket.openDownloadStream(objectId),
      contentType: file.contentType ?? 'application/octet-stream',
      filename: file.filename,
      length: file.length,
    };
  }

  private async tryDelete(bucket: GridFSBucket, id: string): Promise<void> {
    try {
      await bucket.delete(this.toObjectId(id));
    } catch {
      // Best-effort: usado em rollback de upload; ignora se já não existe.
    }
  }

  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new NotFoundException({
        codigo: 'ARQUIVO_NAO_ENCONTRADO',
        message: 'Identificador de arquivo inválido.',
      });
    }
  }
}
