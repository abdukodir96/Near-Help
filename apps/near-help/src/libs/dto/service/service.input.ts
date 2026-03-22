import { Field, Float, InputType } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	MaxLength,
	Min,
} from 'class-validator';
import { ServiceOption } from '../../enums/service-option.enum';
import { ServiceCategory, ServiceLocation } from '../../enums/service.enum';

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
