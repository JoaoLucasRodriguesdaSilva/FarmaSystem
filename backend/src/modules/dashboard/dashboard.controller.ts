import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { PeriodoQueryDto } from './dto/dashboard-queries.dto';
import {
  DispensacaoSemanalDto,
  MetricasDashboardDto,
  PontoSerieDto,
  ProdutoMaisVendidoDto,
} from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metricas')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Cards do dashboard com variação percentual.' })
  @ApiOkResponse({ type: MetricasDashboardDto })
  async metricas(
    @Query() query: PeriodoQueryDto,
  ): Promise<MetricasDashboardDto> {
    return this.dashboardService.metricas(query.periodo);
  }

  @Get('vendas')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Série temporal de vendas (quantidade).' })
  @ApiOkResponse({ type: [PontoSerieDto] })
  async vendas(@Query() query: PeriodoQueryDto): Promise<PontoSerieDto[]> {
    return this.dashboardService.serieVendas(query.periodo);
  }

  @Get('receita')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Série temporal de receita.' })
  @ApiOkResponse({ type: [PontoSerieDto] })
  async receita(@Query() query: PeriodoQueryDto): Promise<PontoSerieDto[]> {
    return this.dashboardService.serieReceita(query.periodo);
  }

  @Get('produtos-mais-vendidos')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Top 5 medicamentos mais vendidos.' })
  @ApiOkResponse({ type: [ProdutoMaisVendidoDto] })
  async produtosMaisVendidos(): Promise<ProdutoMaisVendidoDto[]> {
    return this.dashboardService.produtosMaisVendidos();
  }

  @Get('dispensacoes-semanais')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Dispensações x receitas processadas (7 dias).' })
  @ApiOkResponse({ type: [DispensacaoSemanalDto] })
  async dispensacoesSemanais(): Promise<DispensacaoSemanalDto[]> {
    return this.dashboardService.dispensacoesSemanais();
  }
}
