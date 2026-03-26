import { Schema } from 'mongoose';
import { ServiceCategory, ServiceStatus } from '../libs/enums/service.enum';
import { ServiceOption } from '../libs/enums/service-option.enum';

const ServiceSchema = new Schema(
	{
		serviceCategory: {
			type: String,
			enum: ServiceCategory,
			required: true,
		},

		serviceStatus: {
			type: String,
			enum: ServiceStatus,
			default: ServiceStatus.ACTIVE,
		},

		serviceOption: {
			type: String,
			enum: ServiceOption,
			default: ServiceOption.STANDARD,
		},

		serviceAddress: {
			type: String,
			required: true,
		},

		serviceArea: {
			type: String,
		},

		serviceTitle: {
			type: String,
			required: true,
		},

		servicePrice: {
			type: Number,
			required: true,
			min: 0,
		},

		serviceViews: {
			type: Number,
			default: 0,
		},

		serviceLikes: {
			type: Number,
			default: 0,
		},

		serviceComments: {
			type: Number,
			default: 0,
		},

		serviceRank: {
			type: Number,
			default: 0,
		},

		serviceImages: {
			type: [String],
			default: [],
		},

		serviceDesc: {
			type: String,
		},

		embedding: {
			type: [Number],
			default: undefined,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		deletedAt: {
			type: Date,
		},

		completedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'services' },
);

ServiceSchema.index({ serviceCategory: 1, serviceStatus: 1, serviceTitle: 1, servicePrice: 1 });
ServiceSchema.index({ memberId: 1, createdAt: -1 });

export default ServiceSchema;
