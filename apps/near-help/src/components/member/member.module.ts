import { Module } from '@nestjs/common';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { WithoutGuard } from '../../libs/guards/without.guard';
import { ViewModule } from '../view/view.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]), AuthModule, ViewModule],
	providers: [MemberResolver, MemberService, AuthGuard, RolesGuard, WithoutGuard],
	exports: [MemberService],
})
export class MemberModule {}
