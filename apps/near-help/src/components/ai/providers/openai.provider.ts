import { Provider } from '@nestjs/common';
import { aiConfig } from '../../../libs/config';
import { OpenAIProviderOptions } from '../types/ai.types';

export const OPENAI_PROVIDER_OPTIONS = Symbol('OPENAI_PROVIDER_OPTIONS');

export const openAIProvider: Provider<OpenAIProviderOptions> = {
	provide: OPENAI_PROVIDER_OPTIONS,
	useFactory: (): OpenAIProviderOptions => ({
		baseUrl: aiConfig.baseUrl,
		apiKey: aiConfig.apiKey,
		pricingModel: aiConfig.pricingModel,
		chatModel: aiConfig.chatModel,
		embeddingModel: aiConfig.embeddingModel,
		timeoutMs: aiConfig.timeoutMs,
		maxRetries: aiConfig.maxRetries,
		pricingEnabled: aiConfig.pricingEnabled,
		embeddingEnabled: aiConfig.embeddingEnabled,
		recommendationEnabled: aiConfig.recommendationEnabled,
		semanticCandidateLimit: aiConfig.semanticCandidateLimit,
		logEnabled: aiConfig.logEnabled,
	}),
};
