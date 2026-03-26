export type OpenAIProviderOptions = {
	baseUrl: string;
	apiKey: string;
	pricingModel: string;
	chatModel: string;
	embeddingModel: string;
	timeoutMs: number;
	maxRetries: number;
	pricingEnabled: boolean;
	logEnabled: boolean;
};

export type StructuredResponseRequest = {
	model: string;
	systemPrompt: string;
	userPrompt: string;
	schemaName: string;
	schema: Record<string, unknown>;
};

export type ResponsesApiOutputItem = {
	type?: string;
	text?: string;
	refusal?: string;
};

export type ResponsesApiResponse = {
	id?: string;
	output_text?: string;
	usage?: {
		input_tokens?: number;
		output_tokens?: number;
		total_tokens?: number;
	};
	output?: Array<{
		type?: string;
		content?: ResponsesApiOutputItem[];
	}>;
	error?: {
		message?: string;
	};
};
