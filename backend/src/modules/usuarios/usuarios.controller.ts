import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
  ApiNoContentResponse,
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
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ListUsuariosQueryDto } from './dto/list-usuarios-query.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import {
  UsuarioResponseDto,
  UsuariosPageDto,
} from './dto/usuario-response.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Dados do próprio usuário autenticado.' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  async me(
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.findById(usuario.id);
  }

  @Get()
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar usuários (paginado).' })
  @ApiOkResponse({ type: UsuariosPageDto })
  async findAll(
    @Query() query: ListUsuariosQueryDto,
  ): Promise<UsuariosPageDto> {
    return this.usuariosService.findAll(query);
  }

  @Post()
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Cadastrar usuário.' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  async create(@Body() dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhes de um usuário (admin ou o próprio usuário).',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    if (usuario.perfil !== PerfilUsuario.ADMINISTRADOR && usuario.id !== id) {
      throw new ForbiddenException({
        codigo: 'ACESSO_NEGADO',
        message: 'Você só pode consultar o seu próprio usuário.',
      });
    }
    return this.usuariosService.findById(id);
  }

  @Put(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Atualizar usuário.' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover (inativar) usuário.' })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usuariosService.remove(id);
  }
}
