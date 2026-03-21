import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViewInput } from '../../libs/dto/view/view.input';
import { View } from '../../libs/dto/view/view';

type ViewRecord = Pick<ViewInput, 'memberId' | 'viewGroup' | 'viewRefId'>;

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (viewExist) return null;

		return this.viewModel.create(input);
	}

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const search: ViewRecord = {
			memberId: input.memberId,
			viewGroup: input.viewGroup,
			viewRefId: input.viewRefId,
		};
		return this.viewModel.findOne(search).exec();
	}
}
