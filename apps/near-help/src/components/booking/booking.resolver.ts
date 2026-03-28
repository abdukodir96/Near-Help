import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Booking, BookingsResult } from '../../libs/dto/booking/booking';
import {
	BookingsInquiry,
	CreateBookingInput,
	GetAgentBookingsInput,
	UpdateBookingStatusInput,
} from '../../libs/dto/booking/booking.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { BookingService } from './booking.service';
import type { AuthMemberPayload } from '../../libs/types/auth';

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

	@UseGuards(AuthGuard)
	@Query(() => BookingsResult)
	public async getMyBookings(
		@AuthMember('_id') customerId: string,
		@Args('input', { nullable: true }) input?: BookingsInquiry,
	): Promise<BookingsResult> {
		console.log('Query: getMyBookings');
		return this.bookingService.getMyBookings(customerId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.AGENT, MemberType.ADMIN)
	@Query(() => BookingsResult)
	public async getAgentBookings(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input', { nullable: true }) input?: GetAgentBookingsInput,
	): Promise<BookingsResult> {
		console.log('Query: getAgentBookings');
		return this.bookingService.getAgentBookings(authMember, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Booking)
	public async updateBookingStatus(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: UpdateBookingStatusInput,
	): Promise<Booking> {
		console.log('Mutation: updateBookingStatus');
		return this.bookingService.updateBookingStatus(authMember, input);
	}
}
