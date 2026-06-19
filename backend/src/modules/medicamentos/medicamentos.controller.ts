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
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { ListMedicamentosQueryDto } from './dto/list-medicamentos-query.dto';
import {
  MedicamentoDetalheDto,
  MedicamentoResponseDto,
  MedicamentosPageDto,
} from './dto/medicamento-response.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { MedicamentosService } from './medicamentos.service';

@ApiTags('medicamentos')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('medicamentos')
export class MedicamentosController {
  constructor(private readonly medicamentosService: MedicamentosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar medicamentos (paginado).' })
  @ApiOkResponse({ type: MedicamentosPageDto })
  async findAll(
    @Query() query: ListMedicamentosQueryDto,
  ): Promise<MedicamentosPageDto> {
    return this.medicamentosService.findAll(query);
  }

  @Post()
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cadastrar medicamento (com imagens e bula).' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imagens', maxCount: 8 },
      { name: 'bula', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateMedicamentoDto,
    @UploadedFiles()
    files: { imagens?: Express.Multer.File[]; bula?: Express.Multer.File[] },
    @CurrentUser() usuario: UsuarioAutenticado,
  ): Promise<MedicamentoDetalheDto> {
    return this.medicamentosService.create(dto, files ?? {}, usuario.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do medicamento (lotes, imagens, bula).' })
  @ApiOkResponse({ type: MedicamentoDetalheDto })
  async findDetalhe(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MedicamentoDetalheDto> {
    return this.medicamentosService.findDetalhe(id);
  }

  @Put(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR, PerfilUsuario.FARMACEUTICO)
  @ApiOperation({ summary: 'Atualizar dados cadastrais do medicamento.' })
  @ApiOkResponse({ type: MedicamentoResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicamentoDto,
  ): Promise<MedicamentoResponseDto> {
    return this.medicamentosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover medicamento (soft-delete).' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.medicamentosService.remove(id);
  }

  // Rotas de mídia: públicas para permitir uso direto em <img src> / download
  // no navegador (não há como enviar header Authorization nesses casos).
  @Public()
  @Get(':id/imagens/:imageId')
  @ApiOperation({ summary: 'Servir uma imagem do medicamento.' })
  async getImagem(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, contentType, length } =
      await this.medicamentosService.getImagem(id, imageId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  }

  @Public()
  @Get(':id/bula')
  @ApiOperation({ summary: 'Download da bula (PDF) do medicamento.' })
  async getBula(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, contentType, filename, length } =
      await this.medicamentosService.getBula(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', length);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename}"`,
    );
    stream.pipe(res);
  }
}
