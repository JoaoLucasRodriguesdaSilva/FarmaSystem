import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ExportarQueryDto,
  FinanceiroPeriodoQueryDto,
} from './dto/financeiro-queries.dto';
import {
  DesempenhoFuncionarioDto,
  FinanceiroKpisDto,
  MargemCategoriaDto,
  PontoReceitaDespesaDto,
} from './dto/financeiro-response.dto';
import { FinanceiroService } from './financeiro.service';

@ApiTags('financeiro')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(PerfilUsuario.ADMINISTRADOR)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs financeiros (receita, despesas, lucro).' })
  @ApiOkResponse({ type: FinanceiroKpisDto })
  async kpis(
    @Query() query: FinanceiroPeriodoQueryDto,
  ): Promise<FinanceiroKpisDto> {
    return this.financeiroService.kpis(query.periodo);
  }

  @Get('receita-despesas')
  @ApiOperation({ summary: 'Série temporal de receita vs despesas.' })
  @ApiOkResponse({ type: [PontoReceitaDespesaDto] })
  async receitaDespesas(
    @Query() query: FinanceiroPeriodoQueryDto,
  ): Promise<PontoReceitaDespesaDto[]> {
    return this.financeiroService.receitaDespesas(query.periodo);
  }

  @Get('margem-por-categoria')
  @ApiOperation({ summary: 'Faturamento e margem estimada por categoria.' })
  @ApiOkResponse({ type: [MargemCategoriaDto] })
  async margemPorCategoria(
    @Query() query: FinanceiroPeriodoQueryDto,
  ): Promise<MargemCategoriaDto[]> {
    return this.financeiroService.margemPorCategoria(query.periodo);
  }

  @Get('desempenho-funcionarios')
  @ApiOperation({ summary: 'Desempenho de vendas por funcionário.' })
  @ApiOkResponse({ type: [DesempenhoFuncionarioDto] })
  async desempenhoFuncionarios(
    @Query() query: FinanceiroPeriodoQueryDto,
  ): Promise<DesempenhoFuncionarioDto[]> {
    return this.financeiroService.desempenhoFuncionarios(query.periodo);
  }

  @Get('exportar')
  @ApiProduces('text/csv', 'application/pdf')
  @ApiOperation({ summary: 'Exportar relatório financeiro (csv | pdf).' })
  async exportar(
    @Query() query: ExportarQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const arquivo = await this.financeiroService.exportar(query);
    res.setHeader('Content-Type', arquivo.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${arquivo.filename}"`,
    );
    res.send(arquivo.buffer);
  }
}
