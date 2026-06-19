import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../../database/postgres/postgres.service';
import { StatusSolicitacao } from '../../../common/enums/status-solicitacao.enum';
import { SolicitacaoReposicaoResponseDto } from '../dto/solicitacao-reposicao.dto';

interface SolicitacaoRow {
  id: number;
  medicamento_id: number;
  medicamento_nome: string | null;
  quantidade_solicitada: number;
  observacao: string | null;
  status: StatusSolicitacao;
  solicitante_id: number | null;
  criada_em: Date;
  atendida_em: Date | null;
}

export interface CreateSolicitacaoData {
  medicamentoId: number;
  quantidadeSolicitada: number;
  observacao?: string;
  solicitanteId: number;
}

@Injectable()
export class SolicitacoesRepository {
  constructor(private readonly db: PostgresService) {}

  private toResponse(row: SolicitacaoRow): SolicitacaoReposicaoResponseDto {
    return {
      id: row.id,
      medicamentoId: row.medicamento_id,
      medicamentoNome: row.medicamento_nome ?? undefined,
      quantidadeSolicitada: row.quantidade_solicitada,
      observacao: row.observacao ?? undefined,
      status: row.status,
      solicitanteId: row.solicitante_id ?? undefined,
      criadaEm: row.criada_em.toISOString(),
      atendidaEm: row.atendida_em?.toISOString(),
    };
  }

  async findAll(
    status?: StatusSolicitacao,
  ): Promise<SolicitacaoReposicaoResponseDto[]> {
    const valores: unknown[] = [];
    let where = '';
    if (status) {
      valores.push(status);
      where = `WHERE s.status = $1`;
    }
    const { rows } = await this.db.query<SolicitacaoRow>(
      `SELECT s.*, m.nome AS medicamento_nome
       FROM solicitacoes_reposicao s
       JOIN medicamentos m ON m.id = s.medicamento_id
       ${where}
       ORDER BY s.criada_em DESC`,
      valores,
    );
    return rows.map((r) => this.toResponse(r));
  }

  async create(
    data: CreateSolicitacaoData,
  ): Promise<SolicitacaoReposicaoResponseDto> {
    const { rows } = await this.db.query<SolicitacaoRow>(
      `INSERT INTO solicitacoes_reposicao
        (medicamento_id, quantidade_solicitada, observacao, solicitante_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *,
         (SELECT nome FROM medicamentos WHERE id = $1) AS medicamento_nome`,
      [
        data.medicamentoId,
        data.quantidadeSolicitada,
        data.observacao ?? null,
        data.solicitanteId,
      ],
    );
    return this.toResponse(rows[0]);
  }
}
