import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import MemberSchema from '../../schemas/Member.model';
import ServiceSchema from '../../schemas/Service.model';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Booking', schema: BookingSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
		]),
		AuthModule,
	],
	providers: [BookingResolver, BookingService, AuthGuard, RolesGuard],
	exports: [BookingService],
})
export class BookingModule {}
