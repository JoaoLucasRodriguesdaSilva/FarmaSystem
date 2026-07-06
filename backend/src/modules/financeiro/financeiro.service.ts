import { Injectable } from '@nestjs/common';
import { Periodo } from '../../common/enums/periodo.enum';
import { ExportarQueryDto } from './dto/financeiro-queries.dto';
import {
  DesempenhoFuncionarioDto,
  FinanceiroKpisDto,
  MargemCategoriaDto,
  PontoReceitaDespesaDto,
} from './dto/financeiro-response.dto';
import { FinanceiroRepository } from './financeiro.repository';
import { ArquivoRelatorio, RelatoriosService } from './relatorios.service';

@Injectable()
export class FinanceiroService {
  constructor(
    private readonly repository: FinanceiroRepository,
    private readonly relatorios: RelatoriosService,
  ) {}

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  async kpis(periodo: Periodo): Promise<FinanceiroKpisDto> {
    const [receita, custo] = await Promise.all([
      this.repository.receitaAtualEAnterior(periodo),
      this.repository.custoAtualEAnterior(periodo),
    ]);

    const despesasAtual = custo.atual;
    const despesasAnt = custo.anterior;
    const lucroAtual = receita.atual - despesasAtual;
    const lucroAnt = receita.anterior - despesasAnt;
    const margemLucro =
      receita.atual > 0 ? Math.round((lucroAtual / receita.atual) * 100) : 0;

    return {
      receitaTotal: {
        valor: this.arredondar(receita.atual),
        variacao: this.repository.pctVariacao(receita.atual, receita.anterior),
      },
      despesas: {
        valor: this.arredondar(despesasAtual),
        variacao: this.repository.pctVariacao(despesasAtual, despesasAnt),
      },
      lucroLiquido: {
        valor: this.arredondar(lucroAtual),
        variacao: this.repository.pctVariacao(lucroAtual, lucroAnt),
      },
      margemLucro,
    };
  }

  receitaDespesas(periodo: Periodo): Promise<PontoReceitaDespesaDto[]> {
    return this.repository.receitaDespesas(periodo);
  }

  margemPorCategoria(periodo: Periodo): Promise<MargemCategoriaDto[]> {
    return this.repository.margemPorCategoria(periodo);
  }

  desempenhoFuncionarios(periodo: Periodo): Promise<DesempenhoFuncionarioDto[]> {
    return this.repository.desempenhoFuncionarios(periodo);
  }

  async exportar(query: ExportarQueryDto): Promise<ArquivoRelatorio> {
    const [kpis, desempenho, margem] = await Promise.all([
      this.kpis(query.periodo),
      this.desempenhoFuncionarios(query.periodo),
      this.margemPorCategoria(query.periodo),
    ]);
    return this.relatorios.gerar(query.formato, {
      periodo: query.periodo,
      kpis,
      desempenho,
      margem,
    });
  }
}
