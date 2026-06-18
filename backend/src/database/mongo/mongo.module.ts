import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import { MONGO_CLIENT, MONGO_DB } from './mongo.constants';
import { MongoService } from './mongo.service';

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<MongoClient> => {
        const uri = config.get<string>('MONGO_URI', 'mongodb://localhost:27017');
        const client = new MongoClient(uri);
        await client.connect();
        new Logger('MongoClient').log('Conectado ao MongoDB.');
        return client;
      },
    },
    {
      provide: MONGO_DB,
      inject: [MONGO_CLIENT, ConfigService],
      useFactory: (client: MongoClient, config: ConfigService): Db =>
        client.db(config.get<string>('MONGO_DB', 'farmasystem_files')),
    },
    MongoService,
  ],
  exports: [MONGO_CLIENT, MONGO_DB, MongoService],
})
export class MongoModule implements OnModuleDestroy {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
    new Logger('MongoClient').log('Conexão MongoDB encerrada.');
  }
}
