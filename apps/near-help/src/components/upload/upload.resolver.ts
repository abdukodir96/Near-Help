import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload';
import { UploadService } from './upload.service';
import { UploadedImage } from '../../libs/dto/upload/upload';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { Message } from '../../libs/enums/common.enum';
import { UploadFile } from '../../libs/types/upload';
import { GraphQLScalarType } from 'graphql';

const UploadScalar = GraphQLUpload as unknown as GraphQLScalarType;

@Resolver()
export class UploadResolver {
	constructor(private readonly uploadService: UploadService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => UploadedImage)
	public async uploadSingleImage(
		@AuthMember('_id') memberId: string,
		@Args({ name: 'file', type: () => UploadScalar }) file: Promise<unknown>,
	): Promise<UploadedImage> {
		console.log('Mutation: uploadSingleImage');
		const normalizedFile = this.toUploadFile(await file);
		const uploadedImage = await this.uploadService.uploadSingleImage(normalizedFile, memberId);
		return uploadedImage;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [UploadedImage])
	public async uploadMultipleImages(
		@AuthMember('_id') memberId: string,
		@Args({ name: 'files', type: () => [UploadScalar] }) files: Array<Promise<unknown>>,
	): Promise<UploadedImage[]> {
		console.log('Mutation: uploadMultipleImages');
		const normalizedFiles = await Promise.all(files.map(async (file) => this.toUploadFile(await file)));
		const uploadedImages = await this.uploadService.uploadMultipleImages(normalizedFiles, memberId);
		return uploadedImages;
	}

	private toUploadFile(file: unknown): UploadFile {
		if (!file || typeof file !== 'object') {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const maybeUpload = file as Partial<UploadFile>;
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
