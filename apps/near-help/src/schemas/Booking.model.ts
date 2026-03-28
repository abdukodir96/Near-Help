import { Schema } from 'mongoose';
import { BookingStatus } from '../libs/enums/booking-status.enum';
import { ServiceOption } from '../libs/enums/service-option.enum';
import { ServiceCategory, ServiceLocation } from '../libs/enums/service.enum';

const BookingSchema = new Schema(
	{
		bookingStatus: {
			type: String,
			enum: BookingStatus,
			default: BookingStatus.PENDING,
		},

		customerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		serviceId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Service',
		},

		serviceCategory: {
			type: String,
			enum: ServiceCategory,
			required: true,
		},

		serviceOption: {
			type: String,
			enum: ServiceOption,
			default: ServiceOption.STANDARD,
		},

		serviceTitleSnapshot: {
			type: String,
			required: true,
			trim: true,
		},

		bookingDate: {
			type: String,
			required: true,
			trim: true,
		},

		bookingTime: {
			type: String,
			required: true,
			trim: true,
		},

		bookingAddress: {
			type: String,
			required: true,
			trim: true,
		},

		bookingArea: {
			type: String,
			enum: ServiceLocation,
		},

		bookingNote: {
			type: String,
			trim: true,
		},

		quotedPrice: {
			type: Number,
			min: 0,
		},

		finalPrice: {
			type: Number,
			min: 0,
		},

		canceledReason: {
			type: String,
			trim: true,
		},

		completedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'bookings' },
);

BookingSchema.index({ customerId: 1, createdAt: -1 });
BookingSchema.index({ agentId: 1, createdAt: -1 });
BookingSchema.index({ serviceId: 1, createdAt: -1 });
BookingSchema.index({ bookingStatus: 1, bookingDate: 1 });
BookingSchema.index({ customerId: 1, bookingStatus: 1, bookingDate: -1 });
BookingSchema.index({ agentId: 1, bookingStatus: 1, bookingDate: -1 });

export default BookingSchema;
