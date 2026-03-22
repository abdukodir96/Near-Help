import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload';
import { UploadService } from './upload.service';
import { UploadedImage } from '../../libs/dto/upload/upload';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { GraphQLScalarType } from 'graphql';
import { UploadFile } from '../../libs/types/upload';
import { Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';

const UploadScalar = GraphQLUpload as unknown as GraphQLScalarType;

@Resolver()
export class UploadResolver {
	constructor(
		private readonly uploadService: UploadService,
		private readonly memberService: MemberService,
	) {}

	@UseGuards(AuthGuard)
	@Mutation(() => UploadedImage)
	public async uploadSingleImage(
		@AuthMember('_id') memberId: string,
		@Args({ name: 'file', type: () => UploadScalar }) file: unknown,
	): Promise<UploadedImage> {
		console.log('Mutation: uploadSingleImage');
		const uploadedImage = await this.uploadService.uploadSingleImage(await this.normalizeUploadFile(file), memberId);
		await this.memberService.updateMember(memberId, { memberImage: uploadedImage.url });
		return uploadedImage;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [UploadedImage])
	public async uploadMultipleImages(
		@AuthMember('_id') memberId: string,
		@Args({ name: 'files', type: () => [UploadScalar] }) files: unknown[],
	): Promise<UploadedImage[]> {
		console.log('Mutation: uploadMultipleImages');
		const normalizedFiles = await Promise.all(files.map((file) => this.normalizeUploadFile(file)));
		const uploadedImages = await this.uploadService.uploadMultipleImages(normalizedFiles, memberId);
		return uploadedImages;
	}

	private async normalizeUploadFile(source: unknown): Promise<UploadFile> {
		const resolved = await Promise.resolve(source);
		if (!resolved || typeof resolved !== 'object') {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const maybeUpload = resolved as Partial<UploadFile>;
		if (
			typeof maybeUpload.filename !== 'string' ||
			typeof maybeUpload.mimetype !== 'string' ||
			typeof maybeUpload.createReadStream !== 'function'
		) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		return {
			filename: maybeUpload.filename,
			mimetype: maybeUpload.mimetype,
			createReadStream: maybeUpload.createReadStream,
		};
	}
}
