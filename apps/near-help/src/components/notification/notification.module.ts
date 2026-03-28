import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../../schemas/Notification.model';
import { NotificationService } from './notification.service';
import { SocketModule } from '../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { NotificationResolver } from './notification.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Notification', schema: NotificationSchema }]),
		AuthModule,
		forwardRef(() => SocketModule),
	],
	providers: [NotificationResolver, NotificationService, AuthGuard],
	exports: [NotificationService],
})
export class NotificationModule {}
