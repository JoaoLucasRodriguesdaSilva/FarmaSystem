import { ApiProperty } from '@nestjs/swagger';
import { StatusReceita } from '../../../common/enums/status-receita.enum';

/** Visão mínima do andamento de uma receita — consultável por qualquer perfil. */
export class SituacaoReceitaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'RX-000001' })
  codigo!: string;

  @ApiProperty({ example: 'João Pereira' })
  pacienteNome!: string;

  @ApiProperty({ enum: StatusReceita })
  status!: StatusReceita;
}
