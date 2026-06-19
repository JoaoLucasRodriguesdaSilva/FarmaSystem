import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientesService } from './clientes.service';
import {
  ClienteResponseDto,
  ClientesPageDto,
} from './dto/cliente-response.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ListClientesQueryDto } from './dto/list-clientes-query.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (paginado, com busca textual).' })
  @ApiOkResponse({ type: ClientesPageDto })
  async findAll(
    @Query() query: ListClientesQueryDto,
  ): Promise<ClientesPageDto> {
    return this.clientesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar cliente.' })
  @ApiOkResponse({ type: ClienteResponseDto })
  async create(@Body() dto: CreateClienteDto): Promise<ClienteResponseDto> {
    return this.clientesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um cliente.' })
  @ApiOkResponse({ type: ClienteResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente.' })
  @ApiOkResponse({ type: ClienteResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover cliente.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.clientesService.remove(id);
  }
}
