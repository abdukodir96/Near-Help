import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ServiceService } from './service.service';
import { Service } from '../../libs/dto/service/service';
import { CreateServiceInput } from '../../libs/dto/service/service.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';

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
}
