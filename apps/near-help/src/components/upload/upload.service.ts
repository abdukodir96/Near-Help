import { BadRequestException, Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { mkdir, stat } from 'fs/promises';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { uploadConfig } from '../../libs/config';
import { UploadedImage } from '../../libs/dto/upload/upload';
import { Message } from '../../libs/enums/common.enum';
import { UploadFile } from '../../libs/types/upload';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

@Injectable()
export class UploadService {
	public async uploadSingleImage(file: UploadFile, memberId: string): Promise<UploadedImage> {
		return this.saveImage(file, memberId);
	}

	public async uploadMultipleImages(files: UploadFile[], memberId: string): Promise<UploadedImage[]> {
		if (!files?.length) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (files.length > uploadConfig.maxImageFiles) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const results = await Promise.all(files.map((file) => this.saveImage(file, memberId)));
		return results;
	}

	private async saveImage(file: UploadFile, memberId: string): Promise<UploadedImage> {
		const mimeType = file.mimetype.toLowerCase();
		const fileExtension = extname(file.filename).toLowerCase();
		const mimeAllowed = ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
		const extensionAllowed = ALLOWED_IMAGE_EXTENSIONS.has(fileExtension);

		if (!mimeAllowed && !extensionAllowed) {
			throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
		}

		const extension = this.resolveExtension(mimeType, fileExtension);
		const targetDir = join(process.cwd(), uploadConfig.rootDir, uploadConfig.imageDir, memberId);
		await mkdir(targetDir, { recursive: true });

		const filename = `${Date.now()}-${uuidv4()}${extension}`;
		const absolutePath = join(targetDir, filename);

		await pipeline(file.createReadStream(), createWriteStream(absolutePath));
		const fileStat = await stat(absolutePath);

		if (fileStat.size > uploadConfig.maxImageBytes) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const url = `/${uploadConfig.rootDir}/${uploadConfig.imageDir}/${memberId}/${filename}`;

		return {
			filename,
			originalName: file.filename,
			mimetype: mimeType,
			size: fileStat.size,
			url,
		};
	}

	private resolveExtension(mimeType: string, fileExtension: string): string {
		switch (mimeType) {
			case 'image/jpeg':
			case 'image/jpg':
			case 'image/pjpeg':
				return '.jpg';
			case 'image/png':
			case 'image/x-png':
				return '.png';
			default:
				if (ALLOWED_IMAGE_EXTENSIONS.has(fileExtension)) {
					return fileExtension === '.jpeg' ? '.jpg' : fileExtension;
				}
				throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
		}
	}
}
