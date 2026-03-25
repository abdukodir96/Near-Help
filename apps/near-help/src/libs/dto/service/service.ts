import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { ServiceOption } from '../../enums/service-option.enum';
import { ServiceCategory, ServiceLocation, ServiceStatus } from '../../enums/service.enum';
import { Member } from '../member/member';

@ObjectType()
export class Service {
	@Field(() => ID)
	_id!: mongoose.ObjectId;

	@Field(() => ServiceCategory)
	serviceCategory!: ServiceCategory;

	@Field(() => ServiceStatus)
	serviceStatus!: ServiceStatus;

	@Field(() => ServiceOption)
	serviceOption!: ServiceOption;

	@Field(() => String)
	serviceAddress!: string;

	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@Field(() => String)
	serviceTitle!: string;

	@Field(() => Float)
	servicePrice!: number;

	@Field(() => Int)
	serviceViews!: number;

	@Field(() => Int)
	serviceLikes!: number;

	@Field(() => Int)
	serviceComments!: number;

	@Field(() => Int)
	serviceRank!: number;

	@Field(() => [String])
	serviceImages!: string[];

	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	completedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Boolean, { nullable: true })
	meLiked?: boolean;

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class ServicePaginationMeta {
	@Field(() => Int)
	totalCount!: number;

	@Field(() => Int)
	page!: number;

	@Field(() => Int)
	limit!: number;

	@Field(() => Int)
	totalPages!: number;

	@Field(() => Boolean)
	hasNextPage!: boolean;

	@Field(() => Boolean)
	hasPrevPage!: boolean;
}

@ObjectType()
export class ServicesResult {
	@Field(() => [Service])
	list!: Service[];

	@Field(() => ServicePaginationMeta)
	meta!: ServicePaginationMeta;
}
