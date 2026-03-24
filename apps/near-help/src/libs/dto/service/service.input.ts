import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Max,
	MaxLength,
	Min,
} from 'class-validator';
import { ServiceOption } from '../../enums/service-option.enum';
import { ServiceCategory, ServiceLocation, ServiceSort, ServiceStatus } from '../../enums/service.enum';

@InputType()
export class CreateServiceInput {
	@IsNotEmpty()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory)
	serviceCategory!: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsNotEmpty()
	@IsString()
	@Length(3, 180)
	@Field(() => String)
	serviceAddress!: string;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsNotEmpty()
	@IsString()
	@Length(3, 120)
	@Field(() => String)
	serviceTitle!: string;

	@IsNotEmpty()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float)
	servicePrice!: number;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	@MaxLength(500, { each: true })
	@Field(() => [String], { nullable: true })
	serviceImages?: string[];

	@IsOptional()
	@IsString()
	@Length(3, 1200)
	@Field(() => String, { nullable: true })
	serviceDesc?: string;
}

@InputType()
export class GetServiceInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	serviceId!: string;
}

@InputType()
export class GetServicesInput {
	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	searchText?: string;

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
	@IsEnum(ServiceSort)
	@Field(() => ServiceSort, { nullable: true })
	sortBy?: ServiceSort;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class UpdateServiceInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetServiceId!: string;

	@IsOptional()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory, { nullable: true })
	serviceCategory?: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsString()
	@Length(3, 180)
	@Field(() => String, { nullable: true })
	serviceAddress?: string;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsOptional()
	@IsString()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	serviceTitle?: string;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	servicePrice?: number;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	@MaxLength(500, { each: true })
	@Field(() => [String], { nullable: true })
	serviceImages?: string[];

	@IsOptional()
	@IsString()
	@Length(3, 1200)
	@Field(() => String, { nullable: true })
	serviceDesc?: string;
}

@InputType()
export class GetAgentServicesInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	agentId!: string;

	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	searchText?: string;

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
	@IsEnum(ServiceSort)
	@Field(() => ServiceSort, { nullable: true })
	sortBy?: ServiceSort;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class GetAllServicesByAdminInput {
	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	searchText?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory, { nullable: true })
	serviceCategory?: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceStatus)
	@Field(() => ServiceStatus, { nullable: true })
	serviceStatus?: ServiceStatus;

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
	@IsEnum(ServiceSort)
	@Field(() => ServiceSort, { nullable: true })
	sortBy?: ServiceSort;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class UpdateServiceByAdminInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetServiceId!: string;

	@IsOptional()
	@IsEnum(ServiceCategory)
	@Field(() => ServiceCategory, { nullable: true })
	serviceCategory?: ServiceCategory;

	@IsOptional()
	@IsEnum(ServiceStatus)
	@Field(() => ServiceStatus, { nullable: true })
	serviceStatus?: ServiceStatus;

	@IsOptional()
	@IsEnum(ServiceOption)
	@Field(() => ServiceOption, { nullable: true })
	serviceOption?: ServiceOption;

	@IsOptional()
	@IsString()
	@Length(3, 180)
	@Field(() => String, { nullable: true })
	serviceAddress?: string;

	@IsOptional()
	@IsEnum(ServiceLocation)
	@Field(() => ServiceLocation, { nullable: true })
	serviceArea?: ServiceLocation;

	@IsOptional()
	@IsString()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	serviceTitle?: string;

	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@Field(() => Float, { nullable: true })
	servicePrice?: number;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	@MaxLength(500, { each: true })
	@Field(() => [String], { nullable: true })
	serviceImages?: string[];

	@IsOptional()
	@IsString()
	@Length(3, 1200)
	@Field(() => String, { nullable: true })
	serviceDesc?: string;
}

@InputType()
export class RemovePropertyByAdminInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetServiceId!: string;
}
