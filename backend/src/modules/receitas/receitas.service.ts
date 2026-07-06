import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusReceita } from '../../common/enums/status-receita.enum';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { ListReceitasQueryDto } from './dto/list-receitas-query.dto';
import {
  ReceitaResponseDto,
  ReceitasPageDto,
} from './dto/receita-response.dto';
import { SituacaoReceitaDto } from './dto/situacao-receita.dto';
import { ReceitasRepository } from './receitas.repository';

@Injectable()
export class ReceitasService {
  constructor(private readonly repository: ReceitasRepository) {}

  async create(dto: CreateReceitaDto): Promise<ReceitaResponseDto> {
    return this.repository.create({
      pacienteNome: dto.pacienteNome,
      prescritor: dto.prescritor,
      urgencia: dto.urgencia,
      medicamentos: dto.medicamentos,
    });
  }

  async findAll(query: ListReceitasQueryDto): Promise<ReceitasPageDto> {
    const { dados, total } = await this.repository.findAll(query);
    return { dados, total, page: query.page, limit: query.limit };
  }

  async findById(id: number): Promise<ReceitaResponseDto> {
    const receita = await this.repository.findById(id);
    if (!receita) {
      throw new NotFoundException({
        codigo: 'RECEITA_NAO_ENCONTRADA',
        message: `Receita ${id} não encontrada.`,
      });
    }
    return receita;
  }

  /** Andamento resumido da receita (para o PDV acompanhar a aprovação). */
  async getSituacao(id: number): Promise<SituacaoReceitaDto> {
    const receita = await this.findById(id);
    return {
      id: receita.id,
      codigo: receita.codigo,
      pacienteNome: receita.pacienteNome,
      status: receita.status,
    };
  }

  /**
   * Aprovação clínica/legal: muda o status para `aprovada` e registra o
   * farmacêutico responsável (auditoria). Não há manipulação de estoque — o
   * débito ocorre apenas no PDV, ao efetivar a venda.
   */
  async aprovar(
    id: number,
    farmaceuticoId: number,
  ): Promise<ReceitaResponseDto> {
    const receita = await this.findById(id);
    this.garantirPendente(receita);
    const atualizada = await this.repository.atualizarStatus(
      id,
      StatusReceita.APROVADA,
      { farmaceuticoId },
    );
    return atualizada as ReceitaResponseDto;
  }

  /**
   * Rejeição clínica/legal: muda o status para `rejeitada` e registra o
   * farmacêutico responsável (auditoria). A venda vinculada no PDV é cancelada.
   */
  async rejeitar(
    id: number,
    farmaceuticoId: number,
  ): Promise<ReceitaResponseDto> {
    const receita = await this.findById(id);
    this.garantirPendente(receita);
    const atualizada = await this.repository.atualizarStatus(
      id,
      StatusReceita.REJEITADA,
      { farmaceuticoId },
    );
    return atualizada as ReceitaResponseDto;
  }

  private garantirPendente(receita: ReceitaResponseDto): void {
    if (receita.status !== StatusReceita.PENDENTE) {
      throw new ConflictException({
        codigo: 'RECEITA_JA_ANALISADA',
        message: `A receita já está com status "${receita.status}".`,
      });
    }
  }
}
