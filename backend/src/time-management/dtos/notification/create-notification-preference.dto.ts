import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum NotificationChannel {
	EMAIL = 'EMAIL',
	SMS = 'SMS',
	IN_APP = 'IN_APP',
}

export class CreateNotificationPreferenceDto {
	@IsEmail()
	userEmail!: string;

	@IsOptional()
	@IsBoolean()
	shiftExpiryAlertsEnabled?: boolean;

	@IsOptional()
	@IsBoolean()
	overtimeAlertsEnabled?: boolean;

	@IsOptional()
	@IsEnum(NotificationChannel, { each: true })
	channels?: NotificationChannel[];

	@IsOptional()
	@IsString()
	timezone?: string;
}
