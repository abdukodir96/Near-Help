import { Module } from '@nestjs/common';
import { UploadResolver } from './upload.resolver';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';

@Module({
	imports: [AuthModule],
	providers: [UploadResolver, UploadService, AuthGuard],
	exports: [UploadService],
})
export class UploadModule {}
