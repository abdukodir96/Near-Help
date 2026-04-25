import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';
import { AiPricingService } from './pricing/ai-pricing.service';
import { openAIProvider } from './providers/openai.provider';
import { AuthModule } from '../auth/auth.module';
import ServiceSchema from '../../schemas/Service.model';
import MemberSchema from '../../schemas/Member.model';
import AiChatSessionSchema from '../../schemas/AiChatSession.model';
import AiChatMessageSchema from '../../schemas/AiChatMessage.model';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { AiEmbeddingService } from './embeddings/ai-embedding.service';
import { AiRecommendationService } from './recommendation/ai-recommendation.service';
import { AiBookingAssistantService } from './booking/ai-booking-assistant.service';
import { AiChatService } from './chat/ai-chat.service';
import { AiChatResolver } from './chat/ai-chat.resolver';

@Module({
	imports: [
		ConfigModule,
		AuthModule,
		MongooseModule.forFeature([
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'AiChatSession', schema: AiChatSessionSchema },
			{ name: 'AiChatMessage', schema: AiChatMessageSchema },
		]),
	],
	providers: [
		openAIProvider,
		AiResolver,
		AiService,
		AiPricingService,
		AiEmbeddingService,
		AiRecommendationService,
		AiBookingAssistantService,
		AiChatService,
		AiChatResolver,
		OptionalAuthGuard,
		AuthGuard,
		RolesGuard,
	],
	exports: [AiService, AiPricingService, AiEmbeddingService, AiRecommendationService, AiBookingAssistantService, AiChatService],
})
export class AiModule {}
