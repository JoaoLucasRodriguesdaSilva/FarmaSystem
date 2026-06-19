import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RestricaoVenda } from '../../../common/enums/restricao-venda.enum';
import { StatusEstoque } from '../../../common/enums/status-estoque.enum';
import { LoteResponseDto } from '../../estoque/dto/lote-response.dto';

export class MedicamentoResponseDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'Dipirona 500mg' })
  nome!: string;

  @ApiProperty({ example: 'Dipirona monoidratada' })
  principioAtivo!: string;

  @ApiProperty({ example: 'Analgésico' })
  categoria!: string;

  @ApiProperty({ example: 'Medley' })
  fabricante!: string;

  @ApiProperty({ example: 'Oral' })
  viaAdministracao!: string;

  @ApiProperty({ example: 'Caixa com 10 comprimidos' })
  apresentacao!: string;

  @ApiProperty({ enum: RestricaoVenda })
  restricaoVenda!: RestricaoVenda;

  @ApiProperty({ example: 12.9 })
  preco!: number;

  @ApiProperty({ example: 100 })
  estoqueAtual!: number;

  @ApiProperty({ example: 20 })
  estoqueMinimo!: number;

  @ApiProperty({ enum: StatusEstoque })
  statusEstoque!: StatusEstoque;

  @ApiPropertyOptional({ example: 1 })
  fornecedorId?: number;

  @ApiProperty({
    type: [String],
    description: 'URLs públicas das imagens (servidas pelo backend).',
    example: ['http://localhost:3000/api/v1/medicamentos/42/imagens/665f...'],
  })
  imagens!: string[];
}

export class MedicamentoDetalheDto extends MedicamentoResponseDto {
  @ApiPropertyOptional({
    description: 'URL para download da bula (PDF), se houver.',
    example: 'http://localhost:3000/api/v1/medicamentos/42/bula',
  })
  bulaUrl?: string;

  @ApiProperty({ type: [LoteResponseDto] })
  lotes!: LoteResponseDto[];
}

export class MedicamentosPageDto {
  @ApiProperty({ type: [MedicamentoResponseDto] })
  dados!: MedicamentoResponseDto[];

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
