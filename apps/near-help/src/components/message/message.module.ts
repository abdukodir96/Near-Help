import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageThreadSchema from '../../schemas/MessageThread.model';
import MessageSchema from '../../schemas/Message.model';
import MemberSchema from '../../schemas/Member.model';
import ServiceSchema from '../../schemas/Service.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MessageThread', schema: MessageThreadSchema },
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
		]),
		AuthModule,
		forwardRef(() => SocketModule),
		forwardRef(() => NotificationModule),
	],
	providers: [MessageResolver, MessageService, AuthGuard, RolesGuard],
	exports: [MessageService],
})
export class MessageModule {}
