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
import { CreateReceitaDto } from './dto/create-receita.dto';
import { ListReceitasQueryDto } from './dto/list-receitas-query.dto';
import {
  ReceitaResponseDto,
  ReceitasPageDto,
} from './dto/receita-response.dto';
import { SituacaoReceitaDto } from './dto/situacao-receita.dto';
import { ReceitasService } from './receitas.service';

@ApiTags('receitas')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('receitas')
export class ReceitasController {
  constructor(private readonly receitasService: ReceitasService) {}

  @Get()
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Listar receitas (filtros por status e urgência).' })
  @ApiOkResponse({ type: ReceitasPageDto })
  async findAll(
    @Query() query: ListReceitasQueryDto,
  ): Promise<ReceitasPageDto> {
    return this.receitasService.findAll(query);
  }

  // Registro liberado a todos os perfis: o PDV (usado também pelo atendente)
  // precisa submeter os dados da receita física para o farmacêutico aprovar.
  @Post()
  @ApiOperation({ summary: 'Registrar receita.' })
  @ApiOkResponse({ type: ReceitaResponseDto })
  async create(@Body() dto: CreateReceitaDto): Promise<ReceitaResponseDto> {
    return this.receitasService.create(dto);
  }

  // Situação resumida liberada a todos os perfis (acompanhamento no PDV).
  @Get(':id/situacao')
  @ApiOperation({ summary: 'Andamento (status) de uma receita.' })
  @ApiOkResponse({ type: SituacaoReceitaDto })
  async getSituacao(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SituacaoReceitaDto> {
    return this.receitasService.getSituacao(id);
  }

  @Get(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Detalhes de uma receita.' })
  @ApiOkResponse({ type: ReceitaResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ReceitaResponseDto> {
    return this.receitasService.findById(id);
  }

  // Aprovar é exclusiva do Farmacêutico (Admin não pode).
  @Post(':id/aprovar')
  @Roles(PerfilUsuario.FARMACEUTICO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar receita (somente Farmacêutico).' })
  @ApiOkResponse({ type: ReceitaResponseDto })
  async aprovar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<ReceitaResponseDto> {
    return this.receitasService.aprovar(id, usuario.id);
  }
}
