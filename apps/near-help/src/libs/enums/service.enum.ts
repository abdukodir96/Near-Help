import { registerEnumType } from '@nestjs/graphql';

export enum ServiceCategory {
	PLUMBING = 'PLUMBING',
	GAS_LINE = 'GAS_LINE',
	ELECTRICITY = 'ELECTRICITY',
	WATER_LINE = 'WATER_LINE',
	BATHROOM_PLUMBING = 'BATHROOM_PLUMBING',
	BASEMENT_PLUMBING = 'BASEMENT_PLUMBING',
	REMODELING = 'REMODELING',
	CLEANING = 'CLEANING',
}
registerEnumType(ServiceCategory, { name: 'ServiceCategory' });

export enum ServiceStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	REJECTED = 'REJECTED',
	DELETED = 'DELETED',
}
registerEnumType(ServiceStatus, { name: 'ServiceStatus' });

export enum ServiceLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	JEONJU = 'JEONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(ServiceLocation, {
	name: 'ServiceLocation',
});

export enum ServiceSort {
	RECENT = 'RECENT',
	OLDER = 'OLDER',
	LOWEST_PRICE = 'LOWEST_PRICE',
	HIGHEST_PRICE = 'HIGHEST_PRICE',
	LIKES = 'LIKES',
	VIEWS = 'VIEWS',
}
registerEnumType(ServiceSort, { name: 'ServiceSort' });
