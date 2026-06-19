import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertasRepository } from '../repositories/alertas.repository';

/**
 * Job diário que varre os lotes e popula `alertas_estoque` com os de validade
 * próxima (vencimento_proximo), garantindo registro histórico. Para testar a
 * geração manualmente, troque a expressão por `CronExpression.EVERY_10_SECONDS`.
 */
@Injectable()
export class AlertasCronService {
  private readonly logger = new Logger(AlertasCronService.name);

  constructor(private readonly alertas: AlertasRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'alertas-vencimento' })
  async gerarAlertasDeVencimento(): Promise<void> {
    try {
      const criados = await this.alertas.gerarAlertasVencimento(90);
      if (criados > 0) {
        this.logger.log(`${criados} alerta(s) de vencimento gerados.`);
      }
    } catch (err) {
      this.logger.error(
        'Falha ao gerar alertas de vencimento.',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
