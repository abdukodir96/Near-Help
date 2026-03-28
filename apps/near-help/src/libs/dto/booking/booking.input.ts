import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	IsEnum,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Max,
	Min,
} from 'class-validator';
import { BookingStatus } from '../../enums/booking-status.enum';
import { ServiceOption } from '../../enums/service-option.enum';
import { ServiceLocation } from '../../enums/service.enum';

@InputType()
export class CreateBookingInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	serviceId!: string;

	@IsNotEmpty()
	@IsString()
	@Length(10, 10)
	@Field(() => String)
	bookingDate!: string;

	@IsNotEmpty()
	@IsString()
	@Length(3, 20)
	@Field(() => String)
	bookingTime!: string;

	@IsNotEmpty()
	@IsString()
	@Length(3, 180)
	@Field(() => String)
	bookingAddress!: string;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	bookingArea?: ServiceLocation;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsString()
	@Length(3, 1200)
	@Field(() => String, { nullable: true })
	bookingNote?: string;
}

@InputType()
export class BookingsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsEnum(BookingStatus)
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;
}

@InputType()
export class UpdateBookingStatusInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	bookingId!: string;

	@IsNotEmpty()
	@IsEnum(BookingStatus)
	@Field(() => BookingStatus)
	bookingStatus!: BookingStatus;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	quotedPrice?: number;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	finalPrice?: number;

	@IsOptional()
	@IsString()
	@Length(3, 300)
	@Field(() => String, { nullable: true })
	canceledReason?: string;
}
