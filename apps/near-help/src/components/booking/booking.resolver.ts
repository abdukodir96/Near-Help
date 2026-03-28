import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Booking } from '../../libs/dto/booking/booking';
import { CreateBookingInput } from '../../libs/dto/booking/booking.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { BookingService } from './booking.service';

@Resolver()
export class BookingResolver {
	constructor(private readonly bookingService: BookingService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.ADMIN)
	@Mutation(() => Booking)
	public async createBooking(
		@AuthMember('_id') customerId: string,
		@Args('input') input: CreateBookingInput,
	): Promise<Booking> {
		console.log('Mutation: createBooking');
		return this.bookingService.createBooking(customerId, input);
	}
}
