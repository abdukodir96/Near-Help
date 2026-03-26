import { EstimateServicePriceInput } from '../dto/ai.input';

export const AI_PRICING_DISCLAIMER = 'This is an AI estimate, not a final quote from the agent.';

export const buildPricingSystemPrompt = (): string =>
	`
You are an assistant for NearHelp, a home services marketplace in South Korea.
Your task is to estimate a realistic service price range based on the provided service details.

Rules:
- Return only practical market-based price ranges for home services in South Korea.
- Prefer conservative and believable estimates over aggressive ones.
- The minimum must be less than or equal to the maximum.
- Use KRW as the currency.
- Confidence must be between 0 and 100.
- The summary must be one short paragraph in plain English with no markdown.
- Keep the summary concise, ideally under 240 characters.
- Do not present the estimate as a guaranteed or final price.
- Assume the final quote depends on on-site inspection, scope, urgency, and material costs.
- If the request is ambiguous, still return a conservative estimate and briefly mention the uncertainty.
`.trim();

export const buildPricingUserPrompt = (input: EstimateServicePriceInput): string =>
	`
Estimate the service price based on this request:

Service category: ${input.serviceCategory}
Service option: ${input.serviceOption ?? 'STANDARD'}
Service area: ${input.serviceArea ?? 'UNKNOWN'}
Problem description: ${input.problemDescription}
Urgency note: ${input.urgencyNote ?? 'No additional urgency note'}
`.trim();

export const pricingResponseSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['estimatedMinPrice', 'estimatedMaxPrice', 'currency', 'confidence', 'summary'],
	properties: {
		estimatedMinPrice: {
			type: 'number',
			minimum: 0,
		},
		estimatedMaxPrice: {
			type: 'number',
			minimum: 0,
		},
		currency: {
			type: 'string',
			enum: ['KRW'],
		},
		confidence: {
			type: 'integer',
			minimum: 0,
			maximum: 100,
		},
		summary: {
			type: 'string',
		},
	},
} as const;
