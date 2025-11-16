import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { JobOfferService } from '../services/job-offer.services';


@Controller('offers')
export class JobOfferController {
constructor(private readonly jobOfferService: JobOfferService) {}


@Post()
create(@Body() body: any) {}
}