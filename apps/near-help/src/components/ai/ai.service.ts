import {
	BadRequestException,
	HttpException,
	Inject,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from '@nestjs/common';
import { OPENAI_PROVIDER_OPTIONS } from './providers/openai.provider';
import type {
	AnthropicMessagesResponse,
	ChatCompletionMessage,
	ChatCompletionResponse,
	EmbeddingsApiResponse,
	OpenAIProviderOptions,
	ResponsesApiResponse,
	StructuredResponseRequest,
} from './types/ai.types';

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

	public getEmbeddingModel(): string {
		return this.openAIOptions.embeddingModel;
	}

	public hasApiKey(): boolean {
		return Boolean(this.openAIOptions.apiKey);
	}

	public hasPricingProvider(): boolean {
		return Boolean(this.openAIOptions.apiKey) || Boolean(this.openAIOptions.openRouterApiKey);
	}

	public isPricingEnabled(): boolean {
		return this.openAIOptions.pricingEnabled;
	}

	public isEmbeddingEnabled(): boolean {
		return this.openAIOptions.embeddingEnabled;
	}

	public isRecommendationEnabled(): boolean {
		return this.openAIOptions.recommendationEnabled;
	}

	public isEmbeddingAvailable(): boolean {
		return this.isEmbeddingEnabled() && this.hasApiKey();
	}

	public isRecommendationAvailable(): boolean {
		return this.isRecommendationEnabled() && this.isEmbeddingAvailable();
	}

	public getSemanticCandidateLimit(): number {
		return this.openAIOptions.semanticCandidateLimit;
	}

	public async createStructuredResponse<T>(request: StructuredResponseRequest): Promise<T> {
		if (this.openAIOptions.apiKey) {
			return this.createStructuredResponseViaOpenAI<T>(request);
		}

		if (this.openAIOptions.openRouterApiKey) {
			return this.createStructuredResponseViaOpenRouter<T>(request);
		}

		throw new ServiceUnavailableException('No structured-response AI provider is configured.');
	}

	private async createStructuredResponseViaOpenAI<T>(request: StructuredResponseRequest): Promise<T> {
		const requestBody = {
			model: request.model,
			input: [
				{
					type: 'message',
					role: 'developer',
					content: [{ type: 'input_text', text: request.systemPrompt }],
				},
				{
					type: 'message',
					role: 'user',
					content: [{ type: 'input_text', text: request.userPrompt }],
				},
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

		const maxAttempts = 1 + Math.max(0, this.openAIOptions.maxRetries);
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

	private async createStructuredResponseViaOpenRouter<T>(request: StructuredResponseRequest): Promise<T> {
		const model = this.openAIOptions.openRouterChatModel;
		const requestBody = {
			model,
			messages: [
				{ role: 'system', content: request.systemPrompt },
				{ role: 'user', content: request.userPrompt },
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: request.schemaName,
					schema: request.schema,
					strict: true,
				},
			},
			max_tokens: 1000,
		};

		const maxAttempts = 1 + Math.max(0, this.openAIOptions.maxRetries);
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const response = await this.performOpenRouterChatRequest(requestBody);
				this.logChatUsage(response, model);

				const content = response.choices?.[0]?.message?.content;
				if (!content?.trim()) {
					throw new ServiceUnavailableException('OpenRouter returned an empty response.');
				}

				return JSON.parse(content.trim()) as T;
			} catch (err: unknown) {
				lastError = err;
				if (attempt === maxAttempts || err instanceof HttpException) {
					throw err;
				}
			}
		}

		throw lastError instanceof Error
			? new ServiceUnavailableException(lastError.message)
			: new ServiceUnavailableException('OpenRouter request failed.');
	}

	private async performOpenRouterChatRequest(body: Record<string, unknown>): Promise<ChatCompletionResponse> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.openAIOptions.timeoutMs);

		try {
			const response = await fetch(`${this.openAIOptions.openRouterBaseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.openAIOptions.openRouterApiKey}`,
					'HTTP-Referer': 'https://nearhelps.com',
					'X-Title': 'NearHelp',
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});

			const payload = await this.parseJsonResponse<ChatCompletionResponse>(response);
			if (!response.ok) {
				throw new ServiceUnavailableException(payload.error?.message ?? 'OpenRouter request failed.');
			}

			return payload;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new ServiceUnavailableException('OpenRouter request timed out.');
			}

			throw err instanceof Error ? new ServiceUnavailableException(err.message) : err;
		} finally {
			clearTimeout(timeout);
		}
	}

	public getChatModel(): string {
		return this.openAIOptions.chatModel;
	}

	public async createChatCompletion(messages: ChatCompletionMessage[]): Promise<string> {
		const hasOpenRouter = Boolean(this.openAIOptions.openRouterApiKey);
		const hasAnthropic = Boolean(this.openAIOptions.anthropicApiKey);

		if (!hasOpenRouter && !hasAnthropic) {
			throw new ServiceUnavailableException('No chat AI provider is configured (OPENROUTER_API_KEY or ANTHROPIC_API_KEY required).');
		}

		if (hasOpenRouter) {
			try {
				return await this.callOpenRouterChat(messages);
			} catch (err: unknown) {
				const reason = err instanceof Error ? err.message : String(err);
				this.logger.warn(`OpenRouter chat failed, falling back to Anthropic. Reason: ${reason}`);

				if (!hasAnthropic) {
					throw new ServiceUnavailableException('Chat AI is temporarily unavailable.');
				}
			}
		}

		return this.callAnthropicChat(messages);
	}

	private async callOpenRouterChat(messages: ChatCompletionMessage[]): Promise<string> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.openAIOptions.timeoutMs);

		try {
			const response = await fetch(`${this.openAIOptions.openRouterBaseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.openAIOptions.openRouterApiKey}`,
					'HTTP-Referer': 'https://nearhelp.com',
					'X-Title': 'NearHelp',
				},
				body: JSON.stringify({
					model: this.openAIOptions.openRouterChatModel,
					messages,
					max_tokens: 1000,
				}),
				signal: controller.signal,
			});

			const payload = await this.parseJsonResponse<ChatCompletionResponse>(response);
			if (!response.ok) {
				throw new ServiceUnavailableException(payload.error?.message ?? 'OpenRouter request failed.');
			}

			this.logChatUsage(payload, this.openAIOptions.openRouterChatModel);

			const content = payload.choices?.[0]?.message?.content;
			if (!content?.trim()) {
				throw new ServiceUnavailableException('OpenRouter returned an empty response.');
			}

			return content.trim();
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new ServiceUnavailableException('OpenRouter request timed out.');
			}
			throw err;
		} finally {
			clearTimeout(timeout);
		}
	}

	private async callAnthropicChat(messages: ChatCompletionMessage[]): Promise<string> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.openAIOptions.timeoutMs);

		const systemMessage = messages.find((m) => m.role === 'system');
		const conversationMessages = messages.filter((m) => m.role !== 'system');

		try {
			const response = await fetch(`${this.openAIOptions.anthropicBaseUrl}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.openAIOptions.anthropicApiKey,
					'anthropic-version': this.openAIOptions.anthropicVersion,
				},
				body: JSON.stringify({
					model: this.openAIOptions.anthropicChatModel,
					max_tokens: 1000,
					...(systemMessage ? { system: systemMessage.content } : {}),
					messages: conversationMessages.map((m) => ({ role: m.role, content: m.content })),
				}),
				signal: controller.signal,
			});

			const payload = await this.parseJsonResponse<AnthropicMessagesResponse>(response);
			if (!response.ok) {
				throw new ServiceUnavailableException(payload.error?.message ?? 'Anthropic request failed.');
			}

			this.logAnthropicUsage(payload, this.openAIOptions.anthropicChatModel);

			const text = payload.content?.find((c) => c.type === 'text')?.text;
			if (!text?.trim()) {
				throw new ServiceUnavailableException('Anthropic returned an empty response.');
			}

			return text.trim();
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new ServiceUnavailableException('Anthropic request timed out.');
			}
			throw err instanceof Error ? new ServiceUnavailableException(err.message) : err;
		} finally {
			clearTimeout(timeout);
		}
	}

	public async createEmbedding(input: string): Promise<number[]> {
		if (!this.isEmbeddingAvailable()) {
			throw new ServiceUnavailableException('AI embeddings are currently unavailable.');
		}

		const cleanedInput = input.trim();
		if (!cleanedInput) {
			throw new BadRequestException('Embedding input cannot be empty.');
		}

		const response = await this.performEmbeddingsRequest({
			model: this.getEmbeddingModel(),
			input: cleanedInput,
		});
		this.logEmbeddingUsage(response, this.getEmbeddingModel());

		const embedding = response.data?.[0]?.embedding;
		if (
			!Array.isArray(embedding) ||
			embedding.length === 0 ||
			embedding.some((value) => typeof value !== 'number' || !Number.isFinite(value))
		) {
			throw new ServiceUnavailableException('OpenAI returned an invalid embedding response.');
		}

		return embedding;
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

			const payload = await this.parseJsonResponse<ResponsesApiResponse>(response);
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

	private async performEmbeddingsRequest(body: Record<string, unknown>): Promise<EmbeddingsApiResponse> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.openAIOptions.timeoutMs);

		try {
			const response = await fetch(`${this.openAIOptions.baseUrl}/embeddings`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.openAIOptions.apiKey}`,
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});

			const payload = await this.parseJsonResponse<EmbeddingsApiResponse>(response);
			if (!response.ok) {
				throw new ServiceUnavailableException(payload.error?.message ?? 'OpenAI embeddings request failed.');
			}

			return payload;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				throw new ServiceUnavailableException('OpenAI embeddings request timed out.');
			}

			throw err instanceof Error ? new ServiceUnavailableException(err.message) : err;
		} finally {
			clearTimeout(timeout);
		}
	}

	private async parseJsonResponse<T extends Record<string, unknown>>(response: Response): Promise<T> {
		const rawBody = await response.text();
		if (!rawBody.trim()) {
			return {} as T;
		}

		try {
			return JSON.parse(rawBody) as T;
		} catch {
			throw new ServiceUnavailableException('OpenAI returned an unreadable JSON response.');
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

	private logAnthropicUsage(response: AnthropicMessagesResponse, model: string): void {
		if (!this.openAIOptions.logEnabled) return;

		const usage = response.usage;
		if (!usage) return;

		this.logger.log(
			`Anthropic model=${model} input=${usage.input_tokens ?? 0} output=${usage.output_tokens ?? 0} total=${(usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)}`,
		);
	}

	private logChatUsage(response: ChatCompletionResponse, model: string): void {
		if (!this.openAIOptions.logEnabled) return;

		const usage = response.usage;
		if (!usage) return;

		this.logger.log(
			`OpenAI chat model=${model} input=${usage.prompt_tokens ?? 0} output=${usage.completion_tokens ?? 0} total=${(usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)}`,
		);
	}

	private logEmbeddingUsage(response: EmbeddingsApiResponse, model: string): void {
		if (!this.openAIOptions.logEnabled) return;

		const usage = response.usage;
		if (!usage) return;

		this.logger.log(
			`OpenAI embedding model=${model} input=${usage.prompt_tokens ?? 0} total=${usage.total_tokens ?? 0}`,
		);
	}
}
