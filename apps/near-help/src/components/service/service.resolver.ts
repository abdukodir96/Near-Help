import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceService } from './service.service';
import { Service, ServicesResult } from '../../libs/dto/service/service';
import {
	CreateServiceInput,
	GetAgentServicesInput,
	GetServiceInput,
	GetServicesInput,
	UpdateServiceInput,
} from '../../libs/dto/service/service.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import type { AuthMemberPayload } from '../../libs/types/auth';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';

@Resolver()
export class ServiceResolver {
	constructor(private readonly serviceService: ServiceService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Service)
	public async createService(
		@AuthMember('_id') memberId: string,
		@Args('input') input: CreateServiceInput,
	): Promise<Service> {
		console.log('Mutation: createService');
		return this.serviceService.createService(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Service)
	public async updateService(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: UpdateServiceInput,
	): Promise<Service> {
		console.log('Mutation: updateService');
		return this.serviceService.updateService(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Service)
	public async getService(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: GetServiceInput,
	): Promise<Service> {
		console.log('Query: getService');
		return this.serviceService.getService(authMember, input);
	}

	@Query(() => ServicesResult)
	public async getServices(@Args('input', { nullable: true }) input?: GetServicesInput): Promise<ServicesResult> {
		console.log('Query: getServices');
		return this.serviceService.getServices(input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => ServicesResult)
	public async getAgentServices(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: GetAgentServicesInput,
	): Promise<ServicesResult> {
		console.log('Query: getAgentServices');
		return this.serviceService.getAgentServices(authMember, input);
	}
}
