import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ServiceModule } from './service/service.module';

@Module({
  imports: [MemberModule, ServiceModule]
})
export class ComponentsModule {}
