import { Types } from 'mongoose';

export class EmployeePublicDto {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  personalEmail?: string;
  workEmail?: string;
  employeeNumber?: string;
  biography?: string;
  profilePictureUrl?: string;
  status?: string;

  constructor(data: any) {
    this.id = data?._id instanceof Types.ObjectId ? data._id.toString() : data._id;

    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.fullName = data.fullName;
    this.personalEmail = data.personalEmail;
    this.workEmail = data.workEmail;
    this.employeeNumber = data.employeeNumber;
    this.biography = data.biography;
    this.profilePictureUrl = data.profilePictureUrl;
    this.status = data.status;
  }
}
