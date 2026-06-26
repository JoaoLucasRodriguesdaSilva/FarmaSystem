import { Injectable } from '@nestjs/common';
import { Periodo } from '../../common/enums/periodo.enum';
import { DashboardRepository } from './dashboard.repository';
import {
  DispensacaoSemanalDto,
  MetricasDashboardDto,
  PontoSerieDto,
  ProdutoMaisVendidoDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  metricas(periodo: Periodo): Promise<MetricasDashboardDto> {
    return this.repository.metricas(periodo);
  }

  serieVendas(periodo: Periodo): Promise<PontoSerieDto[]> {
    return this.repository.serie(periodo, 'quantidade');
  }

  serieReceita(periodo: Periodo): Promise<PontoSerieDto[]> {
    return this.repository.serie(periodo, 'receita');
  }

  produtosMaisVendidos(): Promise<ProdutoMaisVendidoDto[]> {
    return this.repository.produtosMaisVendidos(5);
  }

  dispensacoesSemanais(): Promise<DispensacaoSemanalDto[]> {
    return this.repository.dispensacoesSemanais();
  }
}
