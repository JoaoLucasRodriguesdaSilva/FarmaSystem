import { api } from './api';
import type { Medicamento, MedicamentoDetalhe, Paginated } from '@/types';

export interface ListarMedicamentosParams {
  page?: number;
  limit?: number;
  busca?: string;
  categoria?: string;
  statusEstoque?: string;
}

export interface NovoMedicamentoInput {
  nome: string;
  principioAtivo: string;
  categoria: string;
  fabricante: string;
  viaAdministracao: string;
  apresentacao: string;
  restricaoVenda: string;
  preco: number;
  estoqueMinimo: number;
  fornecedorId?: number;
  unidadesIniciais?: number;
  validadeMinima?: string;
  lote?: string;
  imagens?: File[];
  bula?: File | null;
}

export const medicamentosService = {
  async listar(
    params: ListarMedicamentosParams = {},
  ): Promise<Paginated<Medicamento>> {
    const { data } = await api.get<Paginated<Medicamento>>('/medicamentos', {
      params,
    });
    return data;
  },

  async obter(id: number): Promise<MedicamentoDetalhe> {
    const { data } = await api.get<MedicamentoDetalhe>(`/medicamentos/${id}`);
    return data;
  },

  async criar(input: NovoMedicamentoInput): Promise<MedicamentoDetalhe> {
    const form = new FormData();
    const campos: [string, unknown][] = [
      ['nome', input.nome],
      ['principioAtivo', input.principioAtivo],
      ['categoria', input.categoria],
      ['fabricante', input.fabricante],
      ['viaAdministracao', input.viaAdministracao],
      ['apresentacao', input.apresentacao],
      ['restricaoVenda', input.restricaoVenda],
      ['preco', input.preco],
      ['estoqueMinimo', input.estoqueMinimo],
      ['fornecedorId', input.fornecedorId],
      ['unidadesIniciais', input.unidadesIniciais],
      ['validadeMinima', input.validadeMinima],
      ['lote', input.lote],
    ];
    for (const [chave, valor] of campos) {
      if (valor !== undefined && valor !== null && valor !== '') {
        form.append(chave, String(valor));
      }
    }
    (input.imagens ?? []).forEach((file) => form.append('imagens', file));
    if (input.bula) {
      form.append('bula', input.bula);
    }

    const { data } = await api.post<MedicamentoDetalhe>('/medicamentos', form);
    return data;
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/medicamentos/${id}`);
  },
};
