import { Injectable } from '@nestjs/common';
import { Interview } from '../schemas/interview.schema';

@Injectable()
export class InterviewService {
  private readonly interviews: Interview[] = [];

  create(interview: Interview) {
    this.interviews.push(interview);
    return interview;
  }

  findAll() {
    return this.interviews;
  }

  findOne(id: string) {
    return this.interviews.find((i: any) => i._id === id);
  }

  update(id: string, updated: Partial<Interview>) {
    const index = this.interviews.findIndex((i: any) => i._id === id);
    if (index === -1) return null;

    this.interviews[index] = { ...this.interviews[index], ...updated };
    return this.interviews[index];
  }

  remove(id: string) {
    const index = this.interviews.findIndex((i: any) => i._id === id);
    if (index === -1) return false;

    this.interviews.splice(index, 1);
    return true;
  }
}
