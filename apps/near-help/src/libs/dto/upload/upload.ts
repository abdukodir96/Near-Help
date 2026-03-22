import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadedImage {
	@Field(() => String)
	filename!: string;

	@Field(() => String)
	originalName!: string;

	@Field(() => String)
	mimetype!: string;

	@Field(() => String)
	originalMimeType!: string;

	@Field(() => Int)
	size!: number;

	@Field(() => String)
	url!: string;
}
