import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { VendaResponseDto } from './dto/venda-response.dto';

const ROTULO_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  pix: 'PIX',
};

export interface DadosComprovante {
  venda: VendaResponseDto;
  funcionarioNome?: string;
  clienteNome?: string;
}

/**
 * Desenha programaticamente o comprovante (cupom não fiscal) com `pdfkit`.
 * Retorna o próprio `PDFDocument`, que é um stream — o controller faz o pipe
 * direto para a resposta HTTP.
 */
@Injectable()
export class PdfReceiptService {
  gerar(dados: DadosComprovante): PDFKit.PDFDocument {
    const { venda } = dados;
    // Largura de cupom (~80mm). Altura generosa; o pdfkit recorta o excedente.
    const doc = new PDFDocument({ size: [226, 600], margin: 16 });
    const moeda = (v: number) =>
      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    doc.fontSize(14).font('Helvetica-Bold').text('FarmaSystem', { align: 'center' });
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Comprovante de venda — não fiscal', { align: 'center' });
    doc.moveDown(0.5);
    this.linha(doc);

    doc.fontSize(8).font('Helvetica');
    doc.text(`Código: ${venda.codigo}`);
    doc.text(`Data: ${new Date(venda.criadaEm).toLocaleString('pt-BR')}`);
    if (dados.funcionarioNome) doc.text(`Atendente: ${dados.funcionarioNome}`);
    if (dados.clienteNome) doc.text(`Cliente: ${dados.clienteNome}`);
    if (venda.status === 'cancelada') {
      doc.font('Helvetica-Bold').text('*** VENDA CANCELADA ***');
      doc.font('Helvetica');
    }
    this.linha(doc);

    doc.font('Helvetica-Bold').text('Itens');
    doc.font('Helvetica');
    for (const item of venda.itens) {
      const nome = item.nome ?? `Medicamento ${item.medicamentoId}`;
      doc.text(nome);
      doc.text(
        `  ${item.quantidade} x ${moeda(item.precoUnitario)}`,
        { continued: true },
      );
      doc.text(moeda(item.subtotal), { align: 'right' });
    }
    this.linha(doc);

    this.parObc(doc, 'Subtotal', moeda(venda.subtotal));
    if (venda.desconto > 0) this.parObc(doc, 'Desconto', `- ${moeda(venda.desconto)}`);
    doc.font('Helvetica-Bold');
    this.parObc(doc, 'TOTAL', moeda(venda.total));
    doc.font('Helvetica');
    this.parObc(
      doc,
      'Pagamento',
      ROTULO_PAGAMENTO[venda.formaPagamento] ?? venda.formaPagamento,
    );

    this.linha(doc);
    doc
      .fontSize(8)
      .text('Obrigado pela preferência!', { align: 'center' });

    doc.end();
    return doc;
  }

  private linha(doc: PDFKit.PDFDocument): void {
    doc.moveDown(0.3);
    const y = doc.y;
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor('#999')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.3);
  }

  private parObc(doc: PDFKit.PDFDocument, rotulo: string, valor: string): void {
    doc.text(rotulo, { continued: true });
    doc.text(valor, { align: 'right' });
  }
}
