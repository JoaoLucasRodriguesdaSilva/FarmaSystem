import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import {
  FornecedorResponseDto,
  FornecedoresPageDto,
} from './dto/fornecedor-response.dto';
import { ListFornecedoresQueryDto } from './dto/list-fornecedores-query.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { FornecedoresRepository } from './fornecedores.repository';

@Injectable()
export class FornecedoresService {
  constructor(private readonly repository: FornecedoresRepository) {}

  async findAll(
    query: ListFornecedoresQueryDto,
  ): Promise<FornecedoresPageDto> {
    const { dados, total } = await this.repository.findAll(query);
    return { dados, total, page: query.page, limit: query.limit };
  }

  async findById(id: number): Promise<FornecedorResponseDto> {
    const fornecedor = await this.repository.findById(id);
    if (!fornecedor) {
      throw new NotFoundException({
        codigo: 'FORNECEDOR_NAO_ENCONTRADO',
        message: `Fornecedor ${id} não encontrado.`,
      });
    }
    return fornecedor;
  }

  async create(dto: CreateFornecedorDto): Promise<FornecedorResponseDto> {
    const existente = await this.repository.findIdByCnpj(dto.cnpj);
    if (existente) {
      throw new ConflictException({
        codigo: 'CNPJ_EM_USO',
        message: 'Já existe um fornecedor com este CNPJ.',
      });
    }
    return this.repository.create(dto);
  }

  async update(
    id: number,
    dto: UpdateFornecedorDto,
  ): Promise<FornecedorResponseDto> {
    await this.findById(id);

    if (dto.cnpj) {
      const donoCnpj = await this.repository.findIdByCnpj(dto.cnpj);
      if (donoCnpj && donoCnpj !== id) {
        throw new ConflictException({
          codigo: 'CNPJ_EM_USO',
          message: 'Já existe um fornecedor com este CNPJ.',
        });
      }
    }

    const atualizado = await this.repository.update(id, dto);
    if (!atualizado) {
      throw new NotFoundException({
        codigo: 'FORNECEDOR_NAO_ENCONTRADO',
        message: `Fornecedor ${id} não encontrado.`,
      });
    }
    return atualizado;
  }

  async remove(id: number): Promise<void> {
    const removido = await this.repository.delete(id);
    if (!removido) {
      throw new NotFoundException({
        codigo: 'FORNECEDOR_NAO_ENCONTRADO',
        message: `Fornecedor ${id} não encontrado.`,
      });
    }
  }
}
