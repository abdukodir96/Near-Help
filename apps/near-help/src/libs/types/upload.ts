import { ReadStream } from 'fs';

export type UploadFile = {
	filename: string;
	mimetype: string;
	createReadStream: () => ReadStream;
};
