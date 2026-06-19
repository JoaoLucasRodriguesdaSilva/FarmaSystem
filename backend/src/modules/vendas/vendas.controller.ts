import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CancelarVendaDto } from './dto/cancelar-venda.dto';
import { CreateVendaDto } from './dto/create-venda.dto';
import { ListVendasQueryDto } from './dto/list-vendas-query.dto';
import {
  ResumoTurnoDto,
  VendaResponseDto,
  VendasPageDto,
} from './dto/venda-response.dto';
import { PdfReceiptService } from './pdf-receipt.service';
import { VendasService } from './vendas.service';

@ApiTags('vendas')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('vendas')
export class VendasController {
  constructor(
    private readonly vendasService: VendasService,
    private readonly pdfReceiptService: PdfReceiptService,
  ) {}

  @Get()
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Listagem global de vendas (paginada, com filtros).' })
  @ApiOkResponse({ type: VendasPageDto })
  async listar(@Query() query: ListVendasQueryDto): Promise<VendasPageDto> {
    return this.vendasService.listar(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar venda (baixa atômica de estoque).' })
  @ApiOkResponse({ type: VendaResponseDto })
  async registrar(
    @Body() dto: CreateVendaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<VendaResponseDto> {
    return this.vendasService.registrar(dto, usuario.id);
  }

  // Rotas estáticas declaradas antes de ':id' para não serem capturadas por ele.
  @Get('minhas')
  @ApiOperation({ summary: 'Vendas do próprio funcionário autenticado.' })
  @ApiOkResponse({ type: VendasPageDto })
  async minhas(
    @Query() query: ListVendasQueryDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<VendasPageDto> {
    return this.vendasService.listarMinhas(usuario.id, query);
  }

  @Get('turno-atual')
  @ApiOperation({ summary: 'Resumo do turno do funcionário (total, qtd, ticket).' })
  @ApiOkResponse({ type: ResumoTurnoDto })
  async turnoAtual(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ResumoTurnoDto> {
    return this.vendasService.resumoTurno(usuario.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma venda.' })
  @ApiOkResponse({ type: VendaResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VendaResponseDto> {
    return this.vendasService.findById(id);
  }

  @Post(':id/cancelar')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar/estornar venda (reverte o estoque).' })
  @ApiOkResponse({ type: VendaResponseDto })
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarVendaDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<VendaResponseDto> {
    return this.vendasService.cancelar(id, dto, usuario.id);
  }

  @Get(':id/comprovante')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Comprovante da venda em PDF.' })
  async comprovante(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const dados = await this.vendasService.dadosComprovante(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="comprovante-${dados.venda.codigo}.pdf"`,
    );
    const doc = this.pdfReceiptService.gerar(dados);
    doc.pipe(res);
  }
}
