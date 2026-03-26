import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
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
