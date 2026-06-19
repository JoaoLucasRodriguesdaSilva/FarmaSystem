import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAlerta } from '../../../common/enums/tipo-alerta.enum';

export class AlertaResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: TipoAlerta })
  tipo!: TipoAlerta;

  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Dipirona 500mg' })
  medicamentoNome?: string;

  @ApiPropertyOptional({ example: 5 })
  quantidadeAtual?: number;

  @ApiPropertyOptional({ example: 20 })
  quantidadeMinima?: number;

  @ApiPropertyOptional({ example: '2026-08-30' })
  dataValidade?: string;

  @ApiPropertyOptional({ example: 73 })
  diasParaVencimento?: number;

  @ApiProperty({ example: false })
  resolvido!: boolean;

  @ApiProperty({ example: '2026-06-18T03:00:00Z' })
  dataCriacao!: string;
}
