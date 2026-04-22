import { ApplicationStatus } from '@prisma/client';

export class UpdateJobDto {
  company?: string;
  position?: string;
  jdText?: string;
  resumeText?: string;
  status?: ApplicationStatus;
  aiFeedback?: string | null;
  interviewAt?: string | null;
  followUpAt?: string | null;
}
