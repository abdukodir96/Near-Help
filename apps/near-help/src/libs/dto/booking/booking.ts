import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { BookingStatus } from '../../enums/booking-status.enum';
import { ServiceOption } from '../../enums/service-option.enum';
import { ServiceCategory, ServiceLocation } from '../../enums/service.enum';
import { Member, PaginationMeta } from '../member/member';
import { Service } from '../service/service';

@ObjectType()
export class Booking {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => BookingStatus)
	bookingStatus!: BookingStatus;

	@Field(() => String)
	customerId!: string;

	@Field(() => String)
	agentId!: string;

	@Field(() => String)
	serviceId!: string;

	@Field(() => ServiceCategory)
	serviceCategory!: ServiceCategory;

	@Field(() => ServiceOption)
	serviceOption!: ServiceOption;

	@Field(() => String)
	serviceTitleSnapshot!: string;

	@Field(() => String)
	bookingDate!: string;

	@Field(() => String)
	bookingTime!: string;

	@Field(() => String)
	bookingAddress!: string;

	@Field(() => ServiceLocation, { nullable: true })
	bookingArea?: ServiceLocation;

	@Field(() => String, { nullable: true })
	bookingNote?: string;

	@Field(() => Float, { nullable: true })
	quotedPrice?: number;

	@Field(() => Float, { nullable: true })
	finalPrice?: number;

	@Field(() => String, { nullable: true })
	canceledReason?: string;

	@Field(() => Date, { nullable: true })
	completedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	customerData?: Member;

	@Field(() => Member, { nullable: true })
	agentData?: Member;

	@Field(() => Service, { nullable: true })
	serviceData?: Service;
}

@ObjectType()
export class BookingsResult {
	@Field(() => [Booking])
	list!: Booking[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}

@ObjectType()
export class BookingStatusCounter {
	@Field(() => BookingStatus)
	bookingStatus!: BookingStatus;

	@Field(() => Int)
	count!: number;
}
