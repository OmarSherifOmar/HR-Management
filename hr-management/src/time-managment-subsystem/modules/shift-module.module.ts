import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftSchema } from '../models/shift.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Shift', schema: ShiftSchema },
		]),
	],
	exports: [MongooseModule],
})
export class ShiftModuleModule {}
