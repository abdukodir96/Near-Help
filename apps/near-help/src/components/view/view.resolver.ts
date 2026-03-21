import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ViewService } from './view.service';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { RecordViewInput } from '../../libs/dto/view/view.input';
import { RecordViewResponse } from '../../libs/dto/view/view';

@Resolver()
export class ViewResolver {
	constructor(private readonly viewService: ViewService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => RecordViewResponse)
	public async recordView(
		@AuthMember('_id') memberId: string,
		@Args('input') input: RecordViewInput,
	): Promise<RecordViewResponse> {
		console.log('Mutation: recordView');
		return this.viewService.recordView(memberId, input);
	}
}
