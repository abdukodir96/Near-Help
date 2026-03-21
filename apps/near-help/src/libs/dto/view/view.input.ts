import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class RecordViewInput {
	@IsNotEmpty()
	@IsEnum(ViewGroup)
	@Field(() => ViewGroup)
	viewGroup!: ViewGroup;

	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	viewRefId!: string;
}
