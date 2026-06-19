import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusReceita } from '../../../common/enums/status-receita.enum';
import { UrgenciaReceita } from '../../../common/enums/urgencia-receita.enum';

export class ReceitaMedicamentoDto {
  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Amoxicilina 500mg' })
  nome?: string;

  @ApiProperty({ example: '1 comprimido a cada 8 horas por 7 dias' })
  posologia!: string;
}

export class ReceitaResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'RX-000001' })
  codigo!: string;

  @ApiProperty({ example: 'João Pereira' })
  pacienteNome!: string;

  @ApiProperty({ example: 'Dra. Ana Lima (CRM 12345)' })
  prescritor!: string;

  @ApiProperty({ type: [ReceitaMedicamentoDto] })
  medicamentos!: ReceitaMedicamentoDto[];

  @ApiProperty({ enum: StatusReceita })
  status!: StatusReceita;

  @ApiProperty({ enum: UrgenciaReceita })
  urgencia!: UrgenciaReceita;

  @ApiProperty({ example: '2026-06-18T12:00:00Z' })
  criadaEm!: string;

  @ApiPropertyOptional({ example: '2026-06-18T13:00:00Z' })
  analisadaEm?: string;

  @ApiPropertyOptional({ example: 2 })
  farmaceuticoId?: number;

  @ApiPropertyOptional({ example: 'Dosagem incompatível.' })
  observacao?: string;
}

export class ReceitasPageDto {
  @ApiProperty({ type: [ReceitaResponseDto] })
  dados!: ReceitaResponseDto[];

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
