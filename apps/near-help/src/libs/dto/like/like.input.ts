import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	likeRefId!: string;

	@IsNotEmpty()
	@IsEnum(LikeGroup)
	@Field(() => LikeGroup)
	likeGroup!: LikeGroup;

	// populated from auth context in service/resolver layer
	memberId?: string;
}
