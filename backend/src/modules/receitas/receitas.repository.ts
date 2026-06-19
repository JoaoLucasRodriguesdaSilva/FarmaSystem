import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { StatusReceita } from '../../common/enums/status-receita.enum';
import { UrgenciaReceita } from '../../common/enums/urgencia-receita.enum';
import {
  ReceitaMedicamentoDto,
  ReceitaResponseDto,
} from './dto/receita-response.dto';

interface ReceitaRow {
  id: number;
  codigo: string;
  paciente_nome: string;
  prescritor: string;
  status: StatusReceita;
  urgencia: UrgenciaReceita;
  criada_em: Date;
  analisada_em: Date | null;
  farmaceutico_id: number | null;
  observacao: string | null;
}

interface ReceitaMedRow {
  receita_id: number;
  medicamento_id: number;
  nome: string | null;
  posologia: string;
}

export interface CreateReceitaData {
  pacienteNome: string;
  prescritor: string;
  urgencia: UrgenciaReceita;
  medicamentos: { medicamentoId: number; posologia: string }[];
}

@Injectable()
export class ReceitasRepository {
  constructor(private readonly db: PostgresService) {}

  private gerarCodigo(): string {
    const base = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1296)
      .toString(36)
      .toUpperCase()
      .padStart(2, '0');
    return `RX-${base}${rand}`;
  }

  private toResponse(
    row: ReceitaRow,
    medicamentos: ReceitaMedicamentoDto[],
  ): ReceitaResponseDto {
    return {
      id: row.id,
      codigo: row.codigo,
      pacienteNome: row.paciente_nome,
      prescritor: row.prescritor,
      medicamentos,
      status: row.status,
      urgencia: row.urgencia,
      criadaEm: row.criada_em.toISOString(),
      analisadaEm: row.analisada_em?.toISOString(),
      farmaceuticoId: row.farmaceutico_id ?? undefined,
      observacao: row.observacao ?? undefined,
    };
  }

  /** Cria a receita e seus itens numa única transação. */
  async create(data: CreateReceitaData): Promise<ReceitaResponseDto> {
    return this.db.transaction(async (client) => {
      const { rows } = await client.query<ReceitaRow>(
        `INSERT INTO receitas (codigo, paciente_nome, prescritor, urgencia)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [this.gerarCodigo(), data.pacienteNome, data.prescritor, data.urgencia],
      );
      const receita = rows[0];

      for (const med of data.medicamentos) {
        await client.query(
          `INSERT INTO receita_medicamentos (receita_id, medicamento_id, posologia)
           VALUES ($1, $2, $3)`,
          [receita.id, med.medicamentoId, med.posologia],
        );
      }

      const medicamentos = await this.medicamentosDaReceita(receita.id);
      return this.toResponse(receita, medicamentos);
    });
  }

  private async medicamentosDaReceita(
    receitaId: number,
  ): Promise<ReceitaMedicamentoDto[]> {
    const { rows } = await this.db.query<ReceitaMedRow>(
      `SELECT rm.receita_id, rm.medicamento_id, m.nome, rm.posologia
       FROM receita_medicamentos rm
       LEFT JOIN medicamentos m ON m.id = rm.medicamento_id
       WHERE rm.receita_id = $1
       ORDER BY rm.id ASC`,
      [receitaId],
    );
    return rows.map((r) => ({
      medicamentoId: r.medicamento_id,
      nome: r.nome ?? undefined,
      posologia: r.posologia,
    }));
  }

  async findById(id: number): Promise<ReceitaResponseDto | null> {
    const { rows } = await this.db.query<ReceitaRow>(
      `SELECT * FROM receitas WHERE id = $1`,
      [id],
    );
    if (!rows[0]) return null;
    const medicamentos = await this.medicamentosDaReceita(id);
    return this.toResponse(rows[0], medicamentos);
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: StatusReceita;
    urgencia?: UrgenciaReceita;
  }): Promise<{ dados: ReceitaResponseDto[]; total: number }> {
    const cond: string[] = [];
    const valores: unknown[] = [];
    if (params.status) {
      valores.push(params.status);
      cond.push(`status = $${valores.length}`);
    }
    if (params.urgencia) {
      valores.push(params.urgencia);
      cond.push(`urgencia = $${valores.length}`);
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const offset = (params.page - 1) * params.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM receitas ${where}`,
      valores,
    );
    const { rows } = await this.db.query<ReceitaRow>(
      `SELECT * FROM receitas ${where}
       ORDER BY
         CASE urgencia WHEN 'urgente' THEN 0 ELSE 1 END,
         criada_em DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    const dados = await this.anexarMedicamentos(rows);
    return { dados, total: Number(total.rows[0]?.total ?? 0) };
  }

  /** Carrega os medicamentos de várias receitas numa única consulta. */
  private async anexarMedicamentos(
    rows: ReceitaRow[],
  ): Promise<ReceitaResponseDto[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const { rows: meds } = await this.db.query<ReceitaMedRow>(
      `SELECT rm.receita_id, rm.medicamento_id, m.nome, rm.posologia
       FROM receita_medicamentos rm
       LEFT JOIN medicamentos m ON m.id = rm.medicamento_id
       WHERE rm.receita_id = ANY($1::int[])
       ORDER BY rm.id ASC`,
      [ids],
    );

    const porReceita = new Map<number, ReceitaMedicamentoDto[]>();
    for (const r of meds) {
      const lista = porReceita.get(r.receita_id) ?? [];
      lista.push({
        medicamentoId: r.medicamento_id,
        nome: r.nome ?? undefined,
        posologia: r.posologia,
      });
      porReceita.set(r.receita_id, lista);
    }

    return rows.map((r) => this.toResponse(r, porReceita.get(r.id) ?? []));
  }

  /**
   * Atualiza o estado da receita. `farmaceuticoId` é gravado para auditoria
   * (informado ao aprovar). Retorna null se a receita não existir.
   */
  async atualizarStatus(
    id: number,
    novoStatus: StatusReceita,
    opcoes: { farmaceuticoId?: number; observacao?: string } = {},
  ): Promise<ReceitaResponseDto | null> {
    const campos = [
      `status = $2`,
      `analisada_em = CURRENT_TIMESTAMP`,
    ];
    const valores: unknown[] = [id, novoStatus];

    if (opcoes.farmaceuticoId !== undefined) {
      valores.push(opcoes.farmaceuticoId);
      campos.push(`farmaceutico_id = $${valores.length}`);
    }
    if (opcoes.observacao !== undefined) {
      valores.push(opcoes.observacao);
      campos.push(`observacao = $${valores.length}`);
    }

    const { rows } = await this.db.query<ReceitaRow>(
      `UPDATE receitas SET ${campos.join(', ')} WHERE id = $1 RETURNING *`,
      valores,
    );
    if (!rows[0]) return null;
    const medicamentos = await this.medicamentosDaReceita(id);
    return this.toResponse(rows[0], medicamentos);
  }
}
