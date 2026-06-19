import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PostgresService } from '../../../database/postgres/postgres.service';
import { TipoAlerta } from '../../../common/enums/tipo-alerta.enum';
import { AlertaResponseDto } from '../dto/alerta-response.dto';

type Executor = Pick<PoolClient, 'query'> | null;

interface AlertaRow {
  id: number;
  tipo: TipoAlerta;
  medicamento_id: number;
  medicamento_nome: string | null;
  quantidade_atual: number | null;
  quantidade_minima: number | null;
  data_validade: Date | null;
  dias_para_vencimento: number | null;
  resolvido: boolean;
  data_criacao: Date;
}

@Injectable()
export class AlertasRepository {
  constructor(private readonly db: PostgresService) {}

  private run<T extends QueryResultRow>(
    client: Executor,
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return client
      ? (client.query(text, params as never[]) as Promise<QueryResult<T>>)
      : this.db.query<T>(text, params);
  }

  private toResponse(row: AlertaRow): AlertaResponseDto {
    return {
      id: row.id,
      tipo: row.tipo,
      medicamentoId: row.medicamento_id,
      medicamentoNome: row.medicamento_nome ?? undefined,
      quantidadeAtual: row.quantidade_atual ?? undefined,
      quantidadeMinima: row.quantidade_minima ?? undefined,
      dataValidade: row.data_validade
        ? row.data_validade.toISOString().slice(0, 10)
        : undefined,
      diasParaVencimento: row.dias_para_vencimento ?? undefined,
      resolvido: row.resolvido,
      dataCriacao: row.data_criacao.toISOString(),
    };
  }

  /** Lista alertas ativos (não resolvidos), com o nome do medicamento. */
  async findAtivos(): Promise<AlertaResponseDto[]> {
    const { rows } = await this.db.query<AlertaRow>(
      `SELECT a.*, m.nome AS medicamento_nome
       FROM alertas_estoque a
       JOIN medicamentos m ON m.id = a.medicamento_id
       WHERE a.resolvido = FALSE
       ORDER BY a.data_criacao DESC`,
    );
    return rows.map((r) => this.toResponse(r));
  }

  /** Marca um alerta como resolvido. Retorna false se não existir/já resolvido. */
  async resolver(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `UPDATE alertas_estoque SET resolvido = TRUE
       WHERE id = $1 AND resolvido = FALSE`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  private async existeAtivo(
    medicamentoId: number,
    tipo: TipoAlerta,
    client: Executor,
  ): Promise<boolean> {
    const { rows } = await this.run<{ existe: boolean }>(
      client,
      `SELECT EXISTS (
         SELECT 1 FROM alertas_estoque
         WHERE medicamento_id = $1 AND tipo = $2 AND resolvido = FALSE
       ) AS existe`,
      [medicamentoId, tipo],
    );
    return rows[0]?.existe ?? false;
  }

  /**
   * Gera (se necessário) um alerta de estoque baixo/esgotado para o medicamento,
   * comparando o saldo atual com o mínimo. Idempotente: não duplica enquanto
   * houver um alerta ativo do mesmo tipo. Pode rodar dentro de uma transação.
   */
  async gerarAlertaEstoque(
    medicamentoId: number,
    client: Executor = null,
  ): Promise<void> {
    const { rows } = await this.run<{
      estoque_atual: number;
      estoque_minimo: number;
    }>(
      client,
      `SELECT estoque_atual, estoque_minimo FROM medicamentos WHERE id = $1`,
      [medicamentoId],
    );
    const med = rows[0];
    if (!med) return;

    let tipo: TipoAlerta | null = null;
    if (med.estoque_atual <= 0) {
      tipo = TipoAlerta.ESGOTADO;
    } else if (med.estoque_atual <= med.estoque_minimo * 1.5) {
      tipo = TipoAlerta.ESTOQUE_BAIXO;
    }
    if (!tipo) return;

    if (await this.existeAtivo(medicamentoId, tipo, client)) return;

    await this.run(
      client,
      `INSERT INTO alertas_estoque
        (tipo, medicamento_id, quantidade_atual, quantidade_minima)
       VALUES ($1, $2, $3, $4)`,
      [tipo, medicamentoId, med.estoque_atual, med.estoque_minimo],
    );
  }

  /**
   * Varre os lotes com validade dentro da janela informada e insere alertas
   * de `vencimento_proximo` que ainda não existam (não resolvidos) para o par
   * medicamento + data de validade. Retorna a quantidade de alertas criados.
   */
  async gerarAlertasVencimento(janelaDias = 90): Promise<number> {
    const { rowCount } = await this.db.query(
      `INSERT INTO alertas_estoque
        (tipo, medicamento_id, quantidade_atual, quantidade_minima,
         data_validade, dias_para_vencimento)
       SELECT 'vencimento_proximo', l.medicamento_id, m.estoque_atual,
              m.estoque_minimo, l.data_validade,
              (l.data_validade - CURRENT_DATE)
       FROM lotes l
       JOIN medicamentos m ON m.id = l.medicamento_id
       WHERE l.quantidade > 0
         AND l.data_validade >= CURRENT_DATE
         AND l.data_validade <= CURRENT_DATE + ($1 || ' days')::interval
         AND NOT EXISTS (
           SELECT 1 FROM alertas_estoque a
           WHERE a.medicamento_id = l.medicamento_id
             AND a.tipo = 'vencimento_proximo'
             AND a.data_validade = l.data_validade
             AND a.resolvido = FALSE
         )`,
      [janelaDias],
    );
    return rowCount ?? 0;
  }
}
