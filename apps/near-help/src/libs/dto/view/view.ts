import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ViewGroup } from '../../enums/view.enum';

@ObjectType()
export class RecordViewResponse {
	@Field(() => Boolean)
	recorded!: boolean;

	@Field(() => ViewGroup)
	viewGroup!: ViewGroup;

	@Field(() => String)
	viewRefId!: string;

	@Field(() => Int)
	totalViews!: number;
}
