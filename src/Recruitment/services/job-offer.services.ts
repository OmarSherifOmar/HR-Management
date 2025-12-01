import { Injectable } from '@nestjs/common';
import { JobOffer } from '../schemas/job-offer.schema';

@Injectable()
export class JobOfferService {
  private readonly offers: JobOffer[] = [];

  create(offer: JobOffer) {
    this.offers.push(offer);
    return offer;
  }

  findAll() {
    return this.offers;
  }

  findOne(id: string) {
    return this.offers.find((o: any) => o._id === id);
  }

  update(id: string, updated: Partial<JobOffer>) {
    const index = this.offers.findIndex((o: any) => o._id === id);
    if (index === -1) return null;

    this.offers[index] = { ...this.offers[index], ...updated };
    return this.offers[index];
  }

  remove(id: string) {
    const index = this.offers.findIndex((o: any) => o._id === id);
    if (index === -1) return false;

    this.offers.splice(index, 1);
    return true;
  }
}
