import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';

@Module({
	imports: [AuthModule, forwardRef(() => MessageModule)],
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class SocketModule {}
