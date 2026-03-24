import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { CommentStatus } from '../../enums/comment.enum';

@InputType()
export class CommentUpdate {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@IsEnum(CommentStatus)
	@Field(() => CommentStatus, { nullable: true })
	commentStatus?: CommentStatus;

	@IsOptional()
	@IsString()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	commentContent?: string;
}
