import { Provider } from '@nestjs/common';
import { aiConfig } from '../../../libs/config';
import { OpenAIProviderOptions } from '../types/ai.types';

export const OPENAI_PROVIDER_OPTIONS = Symbol('OPENAI_PROVIDER_OPTIONS');

const parsePositiveIntEnv = (key: string, fallback: number): number => {
	const parsed = Number.parseInt(process.env[key] ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const openAIProvider: Provider<OpenAIProviderOptions> = {
	provide: OPENAI_PROVIDER_OPTIONS,
	useFactory: (): OpenAIProviderOptions => ({
		baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
		apiKey: process.env.OPENAI_API_KEY ?? '',
		pricingModel: process.env.OPENAI_MODEL_PRICING ?? 'gpt-5-mini',
		chatModel: process.env.OPENAI_MODEL_CHAT ?? 'gpt-5-mini',
		embeddingModel: process.env.OPENAI_MODEL_EMBEDDING ?? 'text-embedding-3-small',
		timeoutMs: parsePositiveIntEnv('OPENAI_TIMEOUT_MS', 15000),
		maxRetries: parsePositiveIntEnv('OPENAI_MAX_RETRIES', 2),
		pricingEnabled: process.env.AI_PRICING_ENABLED !== 'false',
		embeddingEnabled: process.env.AI_EMBEDDING_ENABLED !== 'false',
		recommendationEnabled: process.env.AI_RECOMMENDATION_ENABLED !== 'false',
		semanticCandidateLimit: parsePositiveIntEnv('AI_SEMANTIC_CANDIDATE_LIMIT', 300),
		logEnabled: process.env.AI_LOG_ENABLED !== 'false',

		openRouterBaseUrl: 'https://openrouter.ai/api/v1',
		openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
		openRouterChatModel: process.env.OPENROUTER_MODEL_CHAT ?? 'openai/gpt-4o-mini',

		anthropicBaseUrl: 'https://api.anthropic.com/v1',
		anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
		anthropicChatModel: process.env.ANTHROPIC_MODEL_CHAT ?? 'claude-3-5-haiku-20241022',
		anthropicVersion: '2023-06-01',
	}),
};
