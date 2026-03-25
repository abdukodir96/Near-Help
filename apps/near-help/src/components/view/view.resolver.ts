import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ViewService } from './view.service';
import { ServicesResult } from '../../libs/dto/service/service';
import { GetVisitedInput } from '../../libs/dto/view/view.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';

@Resolver()
export class ViewResolver {
	constructor(private readonly viewService: ViewService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Query(() => ServicesResult)
	public async getVisited(
		@AuthMember('_id') memberId: string,
		@Args('input', { nullable: true }) input?: GetVisitedInput,
	): Promise<ServicesResult> {
		console.log('Query: getVisited');
		return this.viewService.getVisited(memberId, input);
	}
}
