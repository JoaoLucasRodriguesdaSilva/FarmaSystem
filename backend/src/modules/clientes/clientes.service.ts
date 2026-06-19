import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientesRepository } from './clientes.repository';
import {
  ClienteResponseDto,
  ClientesPageDto,
} from './dto/cliente-response.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ListClientesQueryDto } from './dto/list-clientes-query.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly repository: ClientesRepository) {}

  async findAll(query: ListClientesQueryDto): Promise<ClientesPageDto> {
    const { dados, total } = await this.repository.findAll(query);
    return { dados, total, page: query.page, limit: query.limit };
  }

  async findById(id: number): Promise<ClienteResponseDto> {
    const cliente = await this.repository.findById(id);
    if (!cliente) {
      throw new NotFoundException({
        codigo: 'CLIENTE_NAO_ENCONTRADO',
        message: `Cliente ${id} não encontrado.`,
      });
    }
    return cliente;
  }

  async create(dto: CreateClienteDto): Promise<ClienteResponseDto> {
    const existente = await this.repository.findIdByCpf(dto.cpf);
    if (existente) {
      throw new ConflictException({
        codigo: 'CPF_EM_USO',
        message: 'Já existe um cliente com este CPF.',
      });
    }
    return this.repository.create(dto);
  }

  async update(
    id: number,
    dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    await this.findById(id);

    if (dto.cpf) {
      const donoCpf = await this.repository.findIdByCpf(dto.cpf);
      if (donoCpf && donoCpf !== id) {
        throw new ConflictException({
          codigo: 'CPF_EM_USO',
          message: 'Já existe um cliente com este CPF.',
        });
      }
    }

    const atualizado = await this.repository.update(id, dto);
    if (!atualizado) {
      throw new NotFoundException({
        codigo: 'CLIENTE_NAO_ENCONTRADO',
        message: `Cliente ${id} não encontrado.`,
      });
    }
    return atualizado;
  }

  async remove(id: number): Promise<void> {
    const removido = await this.repository.delete(id);
    if (!removido) {
      throw new NotFoundException({
        codigo: 'CLIENTE_NAO_ENCONTRADO',
        message: `Cliente ${id} não encontrado.`,
      });
    }
  }
}
