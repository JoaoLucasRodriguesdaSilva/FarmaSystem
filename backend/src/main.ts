import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3001'),
    credentials: true,
  });

  // Validação na porta de entrada (DTOs com class-validator).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Contrato da API: erros de validação retornam 422 (ver swagger_api.md).
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  // Padronização de erros: { codigo, mensagem, detalhes? }.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Documentação OpenAPI/Swagger.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FarmaSystem API')
    .setDescription('API REST do Sistema de Vendas para Farmácia')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`FarmaSystem API em http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
