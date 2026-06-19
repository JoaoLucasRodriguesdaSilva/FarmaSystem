import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLoteDto } from './dto/create-lote.dto';
import { CreateMovimentacaoDto } from './dto/create-movimentacao.dto';
import {
  ListEstoqueQueryDto,
  ListLotesQueryDto,
  ListMovimentacoesQueryDto,
} from './dto/estoque-queries.dto';
import {
  EstoquePageDto,
  MovimentacaoResponseDto,
} from './dto/estoque-response.dto';
import { LoteResponseDto } from './dto/lote-response.dto';
import { EstoqueService } from './estoque.service';

@ApiTags('estoque')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get()
  @ApiOperation({ summary: 'Estoque agregado por medicamento.' })
  @ApiOkResponse({ type: EstoquePageDto })
  async listarEstoque(
    @Query() query: ListEstoqueQueryDto,
  ): Promise<EstoquePageDto> {
    return this.estoqueService.listarEstoque(query);
  }

  @Get('lotes')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Listar lotes.' })
  @ApiOkResponse({ type: [LoteResponseDto] })
  async listarLotes(
    @Query() query: ListLotesQueryDto,
  ): Promise<LoteResponseDto[]> {
    return this.estoqueService.listarLotes(query);
  }

  @Post('lotes')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Registrar novo lote (gera entrada de estoque).' })
  @ApiOkResponse({ type: LoteResponseDto })
  async adicionarLote(
    @Body() dto: CreateLoteDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<LoteResponseDto> {
    return this.estoqueService.adicionarLote(dto, usuario.id);
  }

  @Get('movimentacoes')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Listar movimentações de estoque.' })
  @ApiOkResponse({ type: [MovimentacaoResponseDto] })
  async listarMovimentacoes(
    @Query() query: ListMovimentacoesQueryDto,
  ): Promise<MovimentacaoResponseDto[]> {
    return this.estoqueService.listarMovimentacoes(query);
  }

  @Post('movimentacoes')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Registrar entrada/saída manual de estoque.' })
  @ApiOkResponse({ type: MovimentacaoResponseDto })
  async registrarMovimentacao(
    @Body() dto: CreateMovimentacaoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<MovimentacaoResponseDto> {
    return this.estoqueService.registrarMovimentacao(dto, usuario.id);
  }
}
