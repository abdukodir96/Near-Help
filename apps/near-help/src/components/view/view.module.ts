import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ViewSchema from '../../schemas/View.model';
import { ViewService } from './view.service';
import { ViewResolver } from './view.resolver';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'View', schema: ViewSchema }]), AuthModule],
	providers: [ViewResolver, ViewService, AuthGuard, RolesGuard],
	exports: [ViewService],
})
export class ViewModule {}
