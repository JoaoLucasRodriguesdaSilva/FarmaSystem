import { ApiProperty } from '@nestjs/swagger';

/** Schema de erro padrão da API (ver swagger_api.md, seção 1.2). */
export class ErrorResponseDto {
  @ApiProperty({ example: 'VENDA_ESTOQUE_INSUFICIENTE' })
  codigo!: string;

  @ApiProperty({ example: 'Estoque insuficiente para Amoxicilina 500mg' })
  mensagem!: string;

  @ApiProperty({
    required: false,
    description: 'Contexto adicional; em erros de validação (422), lista as falhas.',
    example: { medicamentoId: 42, disponivel: 3, solicitado: 10 },
  })
  detalhes?: unknown;
}
