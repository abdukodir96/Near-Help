import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';
import { AiPricingService } from './pricing/ai-pricing.service';
import { openAIProvider } from './providers/openai.provider';

@Module({
	imports: [ConfigModule],
	providers: [openAIProvider, AiResolver, AiService, AiPricingService],
	exports: [AiService, AiPricingService],
})
export class AiModule {}
