import { registerEnumType } from '@nestjs/graphql';

export enum ServiceStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	REJECT = 'REJECT',
	DELETE = 'DELETE',
}
registerEnumType(ServiceStatus, { name: 'ServiceStatus' });
