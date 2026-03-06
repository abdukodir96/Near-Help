import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	CANCELED = 'CANCELED',
}
registerEnumType(BookingStatus, { name: 'BookingStatus' });
