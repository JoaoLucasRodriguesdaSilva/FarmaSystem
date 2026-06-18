import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ListUsuariosQueryDto } from './dto/list-usuarios-query.dto';
import {
  UsuarioResponseDto,
  UsuariosPageDto,
} from './dto/usuario-response.dto';
import { UsuariosRepository } from './usuarios.repository';

const BCRYPT_ROUNDS = 10;
const ADMIN_SEED_EMAIL = 'adm@gmail.com';
const ADMIN_SEED_SENHA = 'adminadmin';

@Injectable()
export class UsuariosService implements OnModuleInit {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(private readonly repository: UsuariosRepository) {}

  /**
   * Seed automático: se não houver nenhum usuário, cria o administrador
   * inicial (adm@gmail.com / adminadmin). Executado na inicialização.
   */
  async onModuleInit(): Promise<void> {
    const total = await this.repository.count();
    if (total > 0) {
      return;
    }
    const senhaHash = await bcrypt.hash(ADMIN_SEED_SENHA, BCRYPT_ROUNDS);
    await this.repository.create({
      nome: 'Administrador',
      email: ADMIN_SEED_EMAIL,
      senhaHash,
      perfil: PerfilUsuario.ADMINISTRADOR,
    });
    this.logger.log(
      `Usuário administrador inicial criado (${ADMIN_SEED_EMAIL}).`,
    );
  }

  async findAll(query: ListUsuariosQueryDto): Promise<UsuariosPageDto> {
    const { dados, total } = await this.repository.findAll({
      page: query.page,
      limit: query.limit,
      perfil: query.perfil,
      status: query.status,
    });
    return { dados, total, page: query.page, limit: query.limit };
  }

  async findById(id: number): Promise<UsuarioResponseDto> {
    const usuario = await this.repository.findById(id);
    if (!usuario) {
      throw new NotFoundException({
        codigo: 'USUARIO_NAO_ENCONTRADO',
        message: `Usuário ${id} não encontrado.`,
      });
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    if (dto.crf && dto.perfil !== PerfilUsuario.FARMACEUTICO) {
      throw new UnprocessableEntityException({
        codigo: 'CRF_INVALIDO',
        message: 'O CRF só pode ser informado para o perfil farmacêutico.',
      });
    }

    if (await this.repository.existsByEmail(dto.email)) {
      throw new ConflictException({
        codigo: 'EMAIL_EM_USO',
        message: 'Já existe um usuário com este e-mail.',
      });
    }

    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
    return this.repository.create({
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      perfil: dto.perfil,
      crf: dto.crf,
    });
  }

  async update(
    id: number,
    dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    await this.findById(id); // garante existência (404 caso contrário)

    if (dto.email && (await this.repository.existsByEmail(dto.email))) {
      const atual = await this.repository.findById(id);
      if (atual && atual.email !== dto.email) {
        throw new ConflictException({
          codigo: 'EMAIL_EM_USO',
          message: 'Já existe um usuário com este e-mail.',
        });
      }
    }

    const atualizado = await this.repository.update(id, dto);
    if (!atualizado) {
      throw new NotFoundException({
        codigo: 'USUARIO_NAO_ENCONTRADO',
        message: `Usuário ${id} não encontrado.`,
      });
    }
    return atualizado;
  }

  async remove(id: number): Promise<void> {
    const removido = await this.repository.softDelete(id);
    if (!removido) {
      throw new NotFoundException({
        codigo: 'USUARIO_NAO_ENCONTRADO',
        message: `Usuário ${id} não encontrado.`,
      });
    }
  }
}
