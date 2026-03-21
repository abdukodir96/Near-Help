import { Field, ID, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { ViewGroup } from '../../enums/view.enum';

@ObjectType()
export class View {
	@Field(() => ID)
	_id!: mongoose.ObjectId;

	@Field(() => ViewGroup)
	viewGroup!: ViewGroup;

	@Field(() => String)
	viewRefId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
