import { Injectable } from '@nestjs/common';
import { Job } from '../schemas/job.schema';

@Injectable()
export class JobService {
  private readonly jobs: Job[] = [];

  create(job: Job) {
    this.jobs.push(job);
    return job;
  }

  findAll() {
    return this.jobs;
  }
 
  findOne(id: string) {
    return this.jobs.find((j: any) => j._id === id);
  }

  update(id: string, updated: Partial<Job>) {
    const index = this.jobs.findIndex((j: any) => j._id === id);
    if (index === -1) return null;

    this.jobs[index] = { ...this.jobs[index], ...updated };
    return this.jobs[index];
  }

  remove(id: string) {
    const index = this.jobs.findIndex((j: any) => j._id === id);
    if (index === -1) return false;

    this.jobs.splice(index, 1);
    return true;
  }
}
