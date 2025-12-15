import { IsString, IsNumber, IsPositive, IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class CreateSigningBonusDto {
    @IsMongoId()
    employeeId: string;

    @IsNumber()
    @IsPositive()
    givenAmount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsDateString()
    paymentDate: Date;
}
