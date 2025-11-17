import { PartialType } from '@nestjs/mapped-types';
import { CreateHolidayCalendarDto } from './create-holiday-calendar.dto';

export class UpdateHolidayCalendarDto extends PartialType(CreateHolidayCalendarDto) {}
