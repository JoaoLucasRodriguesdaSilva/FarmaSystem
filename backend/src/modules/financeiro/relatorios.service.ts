import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { FormatoExportacao } from './dto/financeiro-queries.dto';
import {
  DesempenhoFuncionarioDto,
  FinanceiroKpisDto,
  MargemCategoriaDto,
} from './dto/financeiro-response.dto';

export interface DadosRelatorio {
  periodo: string;
  kpis: FinanceiroKpisDto;
  desempenho: DesempenhoFuncionarioDto[];
  margem: MargemCategoriaDto[];
}

export interface ArquivoRelatorio {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Geração dos relatórios financeiros. CSV é montado nativamente (sem libs),
 * concatenando strings separadas por vírgula; PDF usa o `pdfkit` já presente.
 */
@Injectable()
export class RelatoriosService {
  gerar(formato: FormatoExportacao, dados: DadosRelatorio): Promise<ArquivoRelatorio> {
    switch (formato) {
      case FormatoExportacao.CSV:
        return Promise.resolve(this.gerarCsv(dados));
      case FormatoExportacao.PDF:
        return this.gerarPdf(dados);
      default:
        throw new UnprocessableEntityException({
          codigo: 'FORMATO_NAO_SUPORTADO',
          message: `Formato "${formato}" não suportado. Use csv ou pdf.`,
        });
    }
  }

  private escapar(valor: string): string {
    if (/[",\n]/.test(valor)) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  private gerarCsv(dados: DadosRelatorio): ArquivoRelatorio {
    const linhas: string[] = [];
    linhas.push(`Relatorio financeiro;periodo:${dados.periodo}`);
    linhas.push('');
    linhas.push('Funcionario,Total Vendido,Qtd Vendas,Ticket Medio');
    for (const d of dados.desempenho) {
      linhas.push(
        [
          this.escapar(d.nome),
          d.totalVendido.toFixed(2),
          String(d.quantidadeVendas),
          d.ticketMedio.toFixed(2),
        ].join(','),
      );
    }
    linhas.push('');
    linhas.push('Categoria,Faturamento,Margem Estimada');
    for (const m of dados.margem) {
      linhas.push(
        [
          this.escapar(m.categoria),
          m.faturamento.toFixed(2),
          m.margem.toFixed(2),
        ].join(','),
      );
    }

    // BOM (﻿) para o Excel reconhecer UTF-8; CRLF entre linhas.
    const csv = '﻿' + linhas.join('\r\n');
    return {
      buffer: Buffer.from(csv, 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      filename: `relatorio-financeiro-${dados.periodo}.csv`,
    };
  }

  private gerarPdf(dados: DadosRelatorio): Promise<ArquivoRelatorio> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const finalizado = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).font('Helvetica-Bold').text('FarmaSystem — Relatório Financeiro');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text(`Período: ${dados.periodo}`);
    doc.fillColor('black').moveDown(1);

    // KPIs
    doc.fontSize(13).font('Helvetica-Bold').text('Indicadores');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Receita total: ${moeda(dados.kpis.receitaTotal.valor)}`);
    doc.text(`Despesas (estimadas): ${moeda(dados.kpis.despesas.valor)}`);
    doc.text(`Lucro líquido: ${moeda(dados.kpis.lucroLiquido.valor)}`);
    doc.text(`Margem de lucro: ${dados.kpis.margemLucro}%`);
    doc.moveDown(1);

    // Desempenho por funcionário
    doc.fontSize(13).font('Helvetica-Bold').text('Desempenho por funcionário');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    if (dados.desempenho.length === 0) {
      doc.fillColor('#777').text('Sem vendas no período.').fillColor('black');
    }
    for (const d of dados.desempenho) {
      doc.text(
        `${d.nome} — ${moeda(d.totalVendido)} em ${d.quantidadeVendas} venda(s) (ticket ${moeda(d.ticketMedio)})`,
      );
    }
    doc.moveDown(1);

    // Margem por categoria
    doc.fontSize(13).font('Helvetica-Bold').text('Margem por categoria');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    if (dados.margem.length === 0) {
      doc.fillColor('#777').text('Sem dados no período.').fillColor('black');
    }
    for (const m of dados.margem) {
      doc.text(
        `${m.categoria} — faturamento ${moeda(m.faturamento)}, margem ${moeda(m.margem)}`,
      );
    }

    doc.end();
    return finalizado.then((buffer) => ({
      buffer,
      contentType: 'application/pdf',
      filename: `relatorio-financeiro-${dados.periodo}.pdf`,
    }));
  }
}
