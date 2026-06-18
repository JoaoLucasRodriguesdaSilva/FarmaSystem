import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
}

/**
 * Filtro global que padroniza todas as respostas de erro no formato
 * { codigo, mensagem, detalhes? } descrito em swagger_api.md.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      codigo: 'ERRO_INTERNO',
      mensagem: 'Ocorreu um erro inesperado.',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = this.fromHttpException(exception, status);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private fromHttpException(
    exception: HttpException,
    status: number,
  ): ErrorBody {
    const res = exception.getResponse();

    // Erros de validação do ValidationPipe: { message: string[] } -> 422.
    if (
      status === HttpStatus.UNPROCESSABLE_ENTITY &&
      typeof res === 'object' &&
      res !== null &&
      Array.isArray((res as Record<string, unknown>).message)
    ) {
      return {
        codigo: 'VALIDACAO_FALHOU',
        mensagem: 'Os dados enviados são inválidos.',
        detalhes: (res as { message: string[] }).message,
      };
    }

    if (typeof res === 'string') {
      return { codigo: this.codeFor(status), mensagem: res };
    }

    const obj = res as Record<string, unknown>;
    const mensagem =
      typeof obj.message === 'string'
        ? obj.message
        : Array.isArray(obj.message)
          ? obj.message.join('; ')
          : exception.message;

    return {
      codigo:
        typeof obj.codigo === 'string' ? obj.codigo : this.codeFor(status),
      mensagem,
      detalhes: obj.detalhes,
    };
  }

  private codeFor(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'REQUISICAO_INVALIDA',
      [HttpStatus.UNAUTHORIZED]: 'NAO_AUTENTICADO',
      [HttpStatus.FORBIDDEN]: 'ACESSO_NEGADO',
      [HttpStatus.NOT_FOUND]: 'NAO_ENCONTRADO',
      [HttpStatus.CONFLICT]: 'CONFLITO',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDACAO_FALHOU',
    };
    return map[status] ?? 'ERRO';
  }
}
