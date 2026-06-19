import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StatusSolicitacao } from '../../../common/enums/status-solicitacao.enum';

export class CreateSolicitacaoReposicaoDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId!: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidadeSolicitada!: number;

  @ApiPropertyOptional({ example: 'Reposição gerada a partir de alerta de estoque baixo.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

export class SolicitacaoReposicaoResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Dipirona 500mg' })
  medicamentoNome?: string;

  @ApiProperty({ example: 50 })
  quantidadeSolicitada!: number;

  @ApiPropertyOptional({ example: 'Reposição gerada a partir de alerta.' })
  observacao?: string;

  @ApiProperty({ enum: StatusSolicitacao })
  status!: StatusSolicitacao;

  @ApiPropertyOptional({ example: 3 })
  solicitanteId?: number;

  @ApiProperty({ example: '2026-06-18T12:00:00Z' })
  criadaEm!: string;

  @ApiPropertyOptional({ example: '2026-06-20T09:00:00Z' })
  atendidaEm?: string;
}
