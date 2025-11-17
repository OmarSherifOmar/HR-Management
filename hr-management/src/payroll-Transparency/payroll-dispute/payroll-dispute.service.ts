import { Injectable } from '@nestjs/common';

@Injectable()
export class PayrollDisputeService {
  create(dto: any) {
    return Promise.resolve({});
  }

  findAll() {
    return Promise.resolve([]);
  }

  findOne(id: string) {
    return Promise.resolve(null);
  }

  update(id: string, dto: any) {
    return Promise.resolve({});
  }

  remove(id: string) {
    return Promise.resolve();
  }
}
