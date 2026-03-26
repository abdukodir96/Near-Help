import { Controller, Get, Logger } from '@nestjs/common';
import { Cron, Timeout } from '@nestjs/schedule';
import { NearHelpBatchService } from './near-help-batch.service';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_SERVICES } from './lib/config';

@Controller()
export class NearHelpBatchController {
	private readonly logger = new Logger(NearHelpBatchController.name);

	constructor(private readonly nearHelpBatchService: NearHelpBatchService) {}

	@Timeout(1000)
	public handleTimeout(): void {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK })
	public async batchRollback(): Promise<void> {
		try {
			this.logger.debug(`[${BATCH_ROLLBACK}] EXECUTED!`);
			await this.nearHelpBatchService.batchRollback();
		} catch (err: unknown) {
			this.logger.error(`[${BATCH_ROLLBACK}] FAILED`, err instanceof Error ? err.stack : String(err));
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_SERVICES })
	public async batchTopServices(): Promise<void> {
		try {
			this.logger.debug(`[${BATCH_TOP_SERVICES}] EXECUTED!`);
			await this.nearHelpBatchService.batchTopServices();
		} catch (err: unknown) {
			this.logger.error(`[${BATCH_TOP_SERVICES}] FAILED`, err instanceof Error ? err.stack : String(err));
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_TOP_AGENTS })
	public async batchTopAgents(): Promise<void> {
		try {
			this.logger.debug(`[${BATCH_TOP_AGENTS}] EXECUTED!`);
			await this.nearHelpBatchService.batchTopAgents();
		} catch (err: unknown) {
			this.logger.error(`[${BATCH_TOP_AGENTS}] FAILED`, err instanceof Error ? err.stack : String(err));
		}
	}

	@Get()
	public getHello(): string {
		return this.nearHelpBatchService.getHello();
	}
}
