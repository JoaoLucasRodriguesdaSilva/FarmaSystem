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
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import {
  FornecedorResponseDto,
  FornecedoresPageDto,
} from './dto/fornecedor-response.dto';
import { ListFornecedoresQueryDto } from './dto/list-fornecedores-query.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { FornecedoresService } from './fornecedores.service';

@ApiTags('fornecedores')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  @Get()
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Listar fornecedores (paginado).' })
  @ApiOkResponse({ type: FornecedoresPageDto })
  async findAll(
    @Query() query: ListFornecedoresQueryDto,
  ): Promise<FornecedoresPageDto> {
    return this.fornecedoresService.findAll(query);
  }

  @Post()
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Cadastrar fornecedor.' })
  @ApiOkResponse({ type: FornecedorResponseDto })
  async create(
    @Body() dto: CreateFornecedorDto,
  ): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.create(dto);
  }

  @Get(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Detalhes de um fornecedor.' })
  @ApiOkResponse({ type: FornecedorResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.findById(id);
  }

  @Put(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Atualizar fornecedor.' })
  @ApiOkResponse({ type: FornecedorResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFornecedorDto,
  ): Promise<FornecedorResponseDto> {
    return this.fornecedoresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover fornecedor.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.fornecedoresService.remove(id);
  }
}
