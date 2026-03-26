import { HttpException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { OPENAI_PROVIDER_OPTIONS } from './providers/openai.provider';
import type { OpenAIProviderOptions, ResponsesApiResponse, StructuredResponseRequest } from './types/ai.types';

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);

	constructor(
		@Inject(OPENAI_PROVIDER_OPTIONS)
		private readonly openAIOptions: OpenAIProviderOptions,
	) {}

	public getPricingModel(): string {
		return this.openAIOptions.pricingModel;
	}

	public isPricingEnabled(): boolean {
		return this.openAIOptions.pricingEnabled;
	}

	public async createStructuredResponse<T>(request: StructuredResponseRequest): Promise<T> {
		if (!this.openAIOptions.apiKey) {
			throw new ServiceUnavailableException('OPENAI_API_KEY is not configured.');
		}

		const requestBody = {
			model: request.model,
			input: [
				{ role: 'system', content: request.systemPrompt },
				{ role: 'user', content: request.userPrompt },
			],
			text: {
				format: {
					type: 'json_schema',
					name: request.schemaName,
					schema: request.schema,
					strict: true,
				},
			},
		};

		const maxAttempts = Math.max(1, this.openAIOptions.maxRetries);
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const response = await this.performRequest(requestBody);
				this.logUsage(response, request.model);

				const refusal = this.extractRefusal(response);
				if (refusal) {
					throw new ServiceUnavailableException(refusal);
				}

				const outputText = this.extractOutputText(response);
				if (!outputText) {
					throw new ServiceUnavailableException('OpenAI returned an empty response.');
				}

				return JSON.parse(outputText) as T;
			} catch (err: unknown) {
				lastError = err;
				if (attempt === maxAttempts || err instanceof HttpException) {
					throw err;
				}
			}
		}

		throw lastError instanceof Error
			? new ServiceUnavailableException(lastError.message)
			: new ServiceUnavailableException('OpenAI request failed.');
	}

	private async performRequest(body: Record<string, unknown>): Promise<ResponsesApiResponse> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.openAIOptions.timeoutMs);

		try {
			const response = await fetch(`${this.openAIOptions.baseUrl}/responses`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.openAIOptions.apiKey}`,
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});

			const payload = (await response.json()) as ResponsesApiResponse;
			if (!response.ok) {
				throw new ServiceUnavailableException(payload.error?.message ?? 'OpenAI request failed.');
			}

			return payload;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new ServiceUnavailableException('OpenAI request timed out.');
			}

			throw err instanceof Error ? new ServiceUnavailableException(err.message) : err;
		} finally {
			clearTimeout(timeout);
		}
	}

	private extractOutputText(response: ResponsesApiResponse): string | undefined {
		if (typeof response.output_text === 'string' && response.output_text.trim()) {
			return response.output_text.trim();
		}

		for (const outputBlock of response.output ?? []) {
			for (const content of outputBlock.content ?? []) {
				if (content.type === 'output_text' && typeof content.text === 'string' && content.text.trim()) {
					return content.text.trim();
				}
			}
		}

		return undefined;
	}

	private extractRefusal(response: ResponsesApiResponse): string | undefined {
		for (const outputBlock of response.output ?? []) {
			for (const content of outputBlock.content ?? []) {
				if (content.type === 'refusal' && typeof content.refusal === 'string' && content.refusal.trim()) {
					return content.refusal.trim();
				}
			}
		}

		return undefined;
	}

	private logUsage(response: ResponsesApiResponse, model: string): void {
		if (!this.openAIOptions.logEnabled) return;

		const usage = response.usage;
		if (!usage) return;

		this.logger.log(
			`OpenAI model=${model} input=${usage.input_tokens ?? 0} output=${usage.output_tokens ?? 0} total=${usage.total_tokens ?? 0}`,
		);
	}
}
