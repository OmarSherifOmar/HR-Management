import { Injectable } from '@nestjs/common';
import { Application } from '../schemas/application.schema';

@Injectable()
export class ApplicationService {
  private readonly applications: Application[] = [];

  create(application: Application) {
    this.applications.push(application);
    return application;
  }

  findAll() {
    return this.applications;
  }

  findOne(id: string) {
    return this.applications.find((a: any) => a._id === id);
  }

  update(id: string, updated: Partial<Application>) {
    const index = this.applications.findIndex((a: any) => a._id === id);
    if (index === -1) return null;

    this.applications[index] = { ...this.applications[index], ...updated };
    return this.applications[index];
  }

  remove(id: string) {
    const index = this.applications.findIndex((a: any) => a._id === id);
    if (index === -1) return false;

    this.applications.splice(index, 1);
    return true;
  }
}
