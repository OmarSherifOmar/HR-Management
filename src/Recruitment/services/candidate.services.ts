import { Injectable } from '@nestjs/common';
import { Candidate } from '../schemas/candidate.schema';

@Injectable()
export class CandidateService {
  private readonly candidates: Candidate[] = [];

  create(candidate: Candidate) {
    this.candidates.push(candidate);
    return candidate;
  }

  findAll() {
    return this.candidates;
  }

  findOne(id: string) {
    return this.candidates.find((c: any) => c._id === id);
  }

  update(id: string, updated: Partial<Candidate>) {
    const index = this.candidates.findIndex((c: any) => c._id === id);
    if (index === -1) return null;

    this.candidates[index] = { ...this.candidates[index], ...updated };
    return this.candidates[index];
  }

  remove(id: string) {
    const index = this.candidates.findIndex((c: any) => c._id === id);
    if (index === -1) return false;

    this.candidates.splice(index, 1);
    return true;
  }
}
