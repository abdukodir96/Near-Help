import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ServiceOption } from '../../../libs/enums/service-option.enum';
import { ServiceCategory, ServiceLocation } from '../../../libs/enums/service.enum';

@InputType()
export class EstimateServicePriceInput {
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory)
	serviceCategory!: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsString()
	@Length(10, 1200)
	@Field(() => String)
	problemDescription!: string;

	@IsOptional()
	@IsString()
	@Length(3, 300)
	@Field(() => String, { nullable: true })
	urgencyNote?: string;
}

@InputType()
export class SemanticSearchServicesInput {
	@IsString()
	@Length(3, 500)
	@Field(() => String)
	searchQuery!: string;

	@IsOptional()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory, { nullable: true })
	serviceCategory?: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	maxPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(50)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class RecommendServicesInput {
	@IsString()
	@Length(10, 1200)
	@Field(() => String)
	problemDescription!: string;

	@IsOptional()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory, { nullable: true })
	serviceCategory?: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	maxPrice?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(20)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class SyncServiceEmbeddingsInput {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;
}
