import { ApplicationStatus } from '@prisma/client';

export class CreateJobDto {
  company!: string;
  position!: string;
  jdText!: string;
  source!: string;
  resumeText?: string;
  status?: ApplicationStatus;
  interviewAt?: string;
  followUpAt?: string;
}
