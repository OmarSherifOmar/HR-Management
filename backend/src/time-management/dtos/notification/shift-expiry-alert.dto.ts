import { IsDateString, IsMongoId, IsString } from 'class-validator';

export class ShiftExpiryAlertDto {
	@IsMongoId()
	assignmentId!: string;

	@IsMongoId()
	employeeId!: string;

	@IsString()
	employeeName!: string;

	@IsString()
	shiftName!: string;

	@IsDateString()
	endDate!: string;

	@IsString()
	message!: string;
}
