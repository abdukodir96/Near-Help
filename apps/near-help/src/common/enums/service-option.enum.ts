import { registerEnumType } from '@nestjs/graphql';

export enum ServiceOption {
	STANDARD = 'STANDARD',
	PREMIUM = 'PREMIUM',
	EMERGENCY = 'EMERGENCY',
}
registerEnumType(ServiceOption, { name: 'ServiceOption' });
